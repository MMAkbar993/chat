/**
 * SPA Navigation Test Script
 * Run with: node test-spa-navigation.cjs
 * Requires: npm install puppeteer
 */

const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Starting SPA Navigation Test...\n');
    
    const browser = await puppeteer.launch({
        headless: false, // Set to true for headless mode
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--start-maximized'],
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' // Use system Chrome
    });

    const page = await browser.newPage();
    
    // Store console messages and errors
    const consoleMessages = [];
    const consoleErrors = [];
    
    page.on('console', msg => {
        const text = msg.text();
        consoleMessages.push(text);
        if (msg.type() === 'error' && !text.includes('Failed to load resource') && !text.includes('404')) {
            consoleErrors.push(text);
            console.log('❌ Console Error:', text);
        }
    });

    // Track page loads to detect full reloads
    let pageLoadCount = 0;
    page.on('load', () => {
        pageLoadCount++;
        console.log(`📄 Page Load Event #${pageLoadCount}`);
    });

    try {
        // Step 1: Navigate to chat page
        console.log('1️⃣ Navigating to http://127.0.0.1:8000/chat');
        await page.goto('http://127.0.0.1:8000/chat', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await page.screenshot({ path: 'test-screenshots/01-initial-load.png', fullPage: true });
        console.log('✅ Initial page loaded\n');

        // Helper function to click sidebar icon and verify
        async function testSidebarNavigation(iconName, expectedUrl, stepNumber) {
            console.log(`${stepNumber}️⃣ Testing ${iconName} navigation`);
            
            const currentPageLoads = pageLoadCount;
            const currentUrl = page.url();
            
            // Try multiple selectors to find the icon
            const selectors = [
                `a[href="${expectedUrl}"]`,
                `.sidebar-icon[data-tab="${iconName.toLowerCase()}"]`,
                `.nav-link[href="${expectedUrl}"]`,
                `button[data-navigate="${expectedUrl}"]`,
                `[data-route="${expectedUrl}"]`
            ];
            
            let clicked = false;
            for (const selector of selectors) {
                try {
                    const element = await page.$(selector);
                    if (element) {
                        await element.click();
                        clicked = true;
                        console.log(`   Clicked using selector: ${selector}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (!clicked) {
                console.log(`   ⚠️ Could not find clickable element for ${iconName}`);
                console.log(`   Trying to find by text or aria-label...`);
                try {
                    await page.evaluate((name) => {
                        const elements = Array.from(document.querySelectorAll('a, button, [role="button"]'));
                        const target = elements.find(el => 
                            el.textContent.toLowerCase().includes(name.toLowerCase()) ||
                            el.getAttribute('aria-label')?.toLowerCase().includes(name.toLowerCase()) ||
                            el.getAttribute('title')?.toLowerCase().includes(name.toLowerCase())
                        );
                        if (target) target.click();
                        return !!target;
                    }, iconName);
                } catch (e) {
                    console.log(`   ❌ Failed to click ${iconName}:`, e.message);
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check if page reloaded
            const reloaded = pageLoadCount > currentPageLoads;
            if (reloaded) {
                console.log(`   ⚠️ WARNING: Page RELOADED (not SPA behavior!)`);
            } else {
                console.log(`   ✅ No page reload detected (SPA working correctly)`);
            }
            
            // Check URL
            const newUrl = page.url();
            const urlChanged = newUrl !== currentUrl;
            const urlCorrect = newUrl.includes(expectedUrl);
            
            if (urlCorrect) {
                console.log(`   ✅ URL updated correctly: ${newUrl}`);
            } else {
                console.log(`   ❌ URL incorrect. Expected: ${expectedUrl}, Got: ${newUrl}`);
            }
            
            // Take screenshot
            const screenshotName = `test-screenshots/${String(stepNumber).padStart(2, '0')}-${iconName.toLowerCase().replace(' ', '-')}.png`;
            await page.screenshot({ path: screenshotName, fullPage: true });
            console.log(`   📸 Screenshot saved: ${screenshotName}\n`);
            
            return { reloaded, urlCorrect, urlChanged };
        }

        // Test each navigation item
        const results = [];
        
        results.push(await testSidebarNavigation('Contacts', '/contact', 2));
        results.push(await testSidebarNavigation('Groups', '/group-chat', 3));
        results.push(await testSidebarNavigation('Status', '/user-status', 4));
        results.push(await testSidebarNavigation('Calls', '/calls', 5));
        results.push(await testSidebarNavigation('Profile', '/profile', 6));
        results.push(await testSidebarNavigation('Settings', '/settings', 7));
        results.push(await testSidebarNavigation('Chats', '/chat', 8));
        
        // Test browser back button
        console.log('9️⃣ Testing browser back button');
        const beforeBackUrl = page.url();
        await page.goBack();
        await new Promise(resolve => setTimeout(resolve, 2000));
        const afterBackUrl = page.url();
        
        if (afterBackUrl !== beforeBackUrl) {
            console.log(`✅ Back button worked: ${afterBackUrl}`);
        } else {
            console.log(`❌ Back button didn't work`);
        }
        
        await page.screenshot({ path: 'test-screenshots/09-back-button-test.png', fullPage: true });
        
        // Generate summary report
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));
        
        const totalReloads = results.filter(r => r.reloaded).length;
        const totalUrlCorrect = results.filter(r => r.urlCorrect).length;
        
        console.log(`\n✅ SPA Navigation (No Reload): ${results.length - totalReloads}/${results.length}`);
        console.log(`✅ Correct URL Updates: ${totalUrlCorrect}/${results.length}`);
        console.log(`❌ JavaScript Errors: ${consoleErrors.length}`);
        console.log(`📄 Total Page Loads: ${pageLoadCount} (should be 1 for true SPA)`);
        
        if (consoleErrors.length > 0) {
            console.log('\n❌ Console Errors Found:');
            consoleErrors.forEach((error, i) => {
                console.log(`   ${i + 1}. ${error}`);
            });
        }
        
        if (totalReloads === 0 && totalUrlCorrect === results.length && consoleErrors.length === 0) {
            console.log('\n🎉 ALL TESTS PASSED! SPA navigation is working correctly!');
        } else {
            console.log('\n⚠️ SOME TESTS FAILED. Please review the issues above.');
        }
        
        console.log('\n📸 Screenshots saved in test-screenshots/ folder');
        console.log('='.repeat(60) + '\n');
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
    } finally {
        await browser.close();
    }
})();
