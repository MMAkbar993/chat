import { initializeFirebase } from './firebase.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    set,
    push,
    onValue,
    get,
    remove, update
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

initializeFirebase(function (app, auth, database, storage) {

    let currentUser = null;

    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user; // Set currentUser to the signed-in user
        } else {
            window.location.href = "/admin";
            document.getElementById("uid").innerText = "No user logged in";
        }
    });

    document.getElementById('saveLanguageBtn').addEventListener('click', function () {
        const languageName = document.getElementById('languageName').value.trim();
        const languageCode = document.getElementById('languageCode').value.trim();
        const rtlStatus = document.getElementById('rtlStatus').checked;
        const defaultStatus = document.getElementById('defaultStatus').checked;

        if (!languageName || !languageCode) {
            showToast(`Please fill in all required fields.`);
            return;
        }

        // Reference to 'languages' node
        const languagesRef = ref(database, 'data/languages');

        // Fetch existing languages to check for duplicates
        get(languagesRef).then(snapshot => {
            const languages = snapshot.val() || {}; // Fix: Ensure languages is always an object
            const isDuplicate = Object.values(languages).some(language =>
                language.code.toLowerCase() === languageCode.toLowerCase()
            );

            if (isDuplicate) {
                showToast('Language name or code already exists.');
            } else {
                // Save the new language
                set(ref(database, `data/languages/${languageName}`), {
                    code: languageCode,
                    rtl: rtlStatus,
                    default: defaultStatus,
                    name: languageName,
                    total: 0, // Initialize total
                    done: 0,  // Initialize done
                    progress: 0, // Initialize progress
                    status: defaultStatus ? "Active" : "Inactive"
                }).then(() => {
                    updateLanguageTable();
                    // Close the modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addLanguageModal'));
                    modal.hide();
                    resetLanguageModal();
                    showToast('Language added successfully!');
                }).catch((error) => {
                    showToast('Failed to save language.');
                });
            }
        }).catch(error => {
            showToast('Error occurred during validation.');
        });
    });
    function resetLanguageModal() {
        document.getElementById('languageName').value = '';
        document.getElementById('languageCode').value = '';
        document.getElementById('rtlStatus').checked = false;
        document.getElementById('defaultStatus').checked = false;
    }
    function updateLanguageTable() {
        const languagesRef = ref(database, 'data/languages'); // Correct reference for languages
        const keywordsRef = ref(database, 'data/keywords'); // Reference for keywords
        const languageTableBody = document.querySelector('tbody'); // Table body where rows are inserted

        // Use the URLs passed from the Blade template
        onValue(languagesRef, snapshot => { // Listening to changes in the languages node
            const languages = snapshot.val();
            languageTableBody.innerHTML = ''; // Clear the existing table content
            // Fetch all keywords
            onValue(keywordsRef, keywordSnapshot => {
                const keywords = keywordSnapshot.val();
                const commonKeywords = (keywords && keywords.common) || {};

                // Loop through each language and calculate the required values
                for (let key in languages) {
                    const languageName = key;
                    const language = languages[key];
                    const languageCode = language.code;

                    // Calculate the total number of keywords (from common)
                    const totalKeywords = Object.keys(commonKeywords).length;

                    // Calculate the number of done (translated) keywords for this language
                    let doneKeywords = 0;

                    // Iterate over the common keywords to check for translations
                    for (let keywordKey in commonKeywords) {
                        // Check if a translation exists for this language and this keyword
                        if (keywords[languageCode] && keywords[languageCode][keywordKey] && keywords[languageCode][keywordKey].translation) {
                            doneKeywords++;
                        }
                    }

                    // Create a row for this language in the table
                    const row = `
                    <tr>
                        <td>
                            <div class="form-check form-check-md">
                                <input class="form-check-input" type="checkbox">
                            </div>
                        </td>
                        <td>
                            <h6 class="d-flex align-items-center fw-medium">
                                ${languageName}
                            </h6>
                        </td>
                        <td>${language.code}</td>
                        <td>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" ${language.rtl ? 'checked' : ''}>
                            </div>
                        </td>
                        <td>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" ${language.default ? 'checked' : ''}>
                            </div>
                        </td>
                        <td>${totalKeywords}</td> <!-- Total keywords count from 'common' -->
                        <td>${doneKeywords}</td> <!-- Number of translated (done) keywords -->
                        <td>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" ${language.status ? 'checked' : ''}>
                            </div>
                        </td>
                        <td>
                            <div class="d-flex align-items-center">
                               
                                  <a href="#" class="btn btn-sm btn-icon btn-light border edit-language me-2" data-bs-toggle="modal" data-bs-target="#editLanguageModal" data-lang-code="${languageName}">
                                    <i class="ti ti-edit"></i>
                                </a>
                                <a href="#" class="btn btn-sm btn-icon btn-light border delete-language me-2" data-lang-code="${languageCode}">
                                    <i class="ti ti-trash"></i>
                                </a>
                                 <a href="${webRoute}?lang=${languageName}" class="btn btn-sm border">Web</a>
                            </div>
                        </td>
                    </tr>
                `;
                    languageTableBody.insertAdjacentHTML('beforeend', row);
                }

                // Attach event listener using event delegation
                languageTableBody.addEventListener('click', function (event) {
                    if (event.target && event.target.classList.contains('delete-language')) {
                        const languageCode = event.target.getAttribute('data-lang-code');

                        // Set the languageCode in the modal
                        const confirmDeleteBtn = document.getElementById('confirmLanguageDeleteBtn');
                        confirmDeleteBtn.setAttribute('data-lang-code', languageCode);

                        // Show the Bootstrap modal
                        const modal = new bootstrap.Modal(document.getElementById('deleteLanguageConfirmationModal'));
                        modal.show();
                    }
                });
                languageTableBody.addEventListener('click', function (event) {
                    if (event.target && event.target.closest('.edit-language')) {
                        // Get the language name (not the code)
                        const languageName = event.target.closest('.edit-language').dataset.langCode;

                        if (!languageName) {
                            return;
                        }

                        // Reference to the language data in Firebase (using the language name)
                        const languageRef = ref(database, `data/languages/${languageName}`);

                        get(languageRef).then(snapshot => {
                            if (snapshot.exists()) {
                                const language = snapshot.val();

                                // Populate modal fields
                                document.getElementById('editlanguageName').value = languageName || '';  // Display the language name (e.g., 'English')
                                document.getElementById('editlanguageCode').value = language.code || ''; // Display the language code (e.g., 'en')
                                document.getElementById('editrtlStatus').checked = language.rtl || false;
                                document.getElementById('editdefaultStatus').checked = language.default || false;

                                // Store the current languageName for saving updates
                                document.getElementById('editLanguageBtn').dataset.languageName = languageName;


                            } else {
                            }
                        }).catch(error => {
                        });
                    }
                });

            });
        });
    }

    document.getElementById('editLanguageBtn').addEventListener('click', function (event) {
        event.preventDefault(); // Prevent form submission

        // Get language name from the "data-lang-code" attribute (not from dataset.languageCode)
        const languageName = event.target.dataset.languageName;

        // Collect updated data from the form
        const updatedLanguageData = {
            name: document.getElementById('editlanguageName').value,
            code: document.getElementById('editlanguageCode').value,
            rtl: document.getElementById('editrtlStatus').checked,
            default: document.getElementById('editdefaultStatus').checked,
        };

        // Update the database
        const languageRef = ref(database, `data/languages/${languageName}`);
        update(languageRef, updatedLanguageData).then(() => {
            showToast('Language updated successfully!');

            // Hide the modal
            const editLanguageModal = bootstrap.Modal.getInstance(document.getElementById('editLanguageModal'));
            editLanguageModal.hide();

            // Refresh the table
            updateLanguageTable();
        }).catch(error => {
            showToast('Failed to update language.');
        });
    });

    document.getElementById('confirmLanguageDeleteBtn').addEventListener('click', function () {
        const languageCode = this.getAttribute('data-lang-code');
    
        // Proceed with deletion
        deleteLanguage(languageCode).then(() => {
            // Show success popup after successful deletion
            showToast("Language deleted successfully!");
    
            // Refresh the table after deletion
            updateLanguageTable();
    
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteLanguageConfirmationModal'));
            modal.hide();
    
            // Remove the modal backdrop properly after the modal is hidden
            removeBackdrop();
        }).catch(error => {
            showToast('Failed to delete language.');
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteLanguageConfirmationModal'));
            modal.hide();
    
            // Forcefully remove the modal backdrop
            removeBackdrop();
        });
    });
    
    // Function to remove any existing modal backdrops
    function removeBackdrop() {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => {
            backdrop.classList.remove('show');
            backdrop.remove();  // Remove the backdrop element from the DOM
        });
    }
    
    
    // Function to delete the language from Firebase
    async function deleteLanguage(languageCode) {
        try {

            // Create a reference to the 'languages' node in Realtime Database
            const languagesRef = ref(database, 'data/languages');

            // Get the snapshot of the languages data
            const snapshot = await get(languagesRef);

            if (snapshot.exists()) {
                // Iterate through each language entry
                const languages = snapshot.val();
                let languageKeyToDelete = null;

                for (let key in languages) {
                    const language = languages[key];
                    // Check if the code matches the one we want to delete
                    if (language.code === languageCode) {
                        languageKeyToDelete = key;  // Store the key of the language to be deleted
                        break;
                    }
                }

                if (languageKeyToDelete) {
                    // Now delete the language using its unique key
                    const languageRef = ref(database, 'data/languages/' + languageKeyToDelete);
                    await remove(languageRef);
                }
            }
        } catch (error) {

        }
    }

    updateLanguageTable();

    document.getElementById('saveKeywordBtn').addEventListener('click', async function () {
        const moduleName = document.getElementById('moduleInput').value.trim();
        const keyword = document.getElementById('keywordInput').value.trim();

        if (!moduleName || !keyword) {
            showToast("Module and keyword cannot be empty");
            return;
        }

        try {
            // Fetch all languages dynamically
            const languagesRef = ref(database, 'data/languages');
            const snapshot = await get(languagesRef);

            if (!snapshot.exists()) {
                showToast("No languages found in the database.");
                return;
            }

            const languages = snapshot.val();

            // Reference to the languageKeywords node in Firebase
            const languageKeywordsRef = ref(database, 'data/languageKeywords');
            const keywordSnapshot = await get(languageKeywordsRef);

            // Get existing keywords, if any
            const existingKeywords = keywordSnapshot.val() || {};

            // Iterate over all languages and set the keyword under the module
            for (const language of Object.keys(languages)) {
                // Ensure the language exists in existingKeywords
                if (!existingKeywords[language]) {
                    existingKeywords[language] = {};
                }

                // Ensure the module (like audio-call, callpage) exists under the language
                if (!existingKeywords[language][moduleName]) {
                    existingKeywords[language][moduleName] = {}; // Create the module if it doesn't exist
                }

                // Add the keyword under the module (if not already present)
                if (!existingKeywords[language][moduleName][keyword]) {
                    existingKeywords[language][moduleName][keyword] = keyword; // Add keyword
                }

                // Save the updated keyword data for this language and module
                await set(ref(database, `data/languageKeywords/${language}/${moduleName}`), existingKeywords[language][moduleName]);
            }

            // Success notification
            showToast('Keyword saved successfully!');
            // Close the modal after saving the keyword
            const keywordModal = document.getElementById('keywordModal');
            const backdrop = document.querySelector('.modal-backdrop');

            // Hide the modal
            keywordModal.style.display = 'none';
            keywordModal.classList.remove('show');

            // Remove the backdrop
            if (backdrop) {
                backdrop.remove();
            }
            // Clear the input fields
            document.getElementById('moduleInput').value = '';
            document.getElementById('keywordInput').value = '';

        } catch (error) {
            showToast('Failed to save keyword.');
        }
    });

    function showToast(message) {
        Toastify({
            text: message,
            duration: 3000, // Duration in milliseconds
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            style: {
                background: "#28a745" // Custom background color using style.background
            },
            stopOnFocus: true, // Prevents dismissing of toast on hover
        }).showToast();
    }

});


