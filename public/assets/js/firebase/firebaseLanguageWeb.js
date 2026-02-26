import { initializeFirebase } from './firebase.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

initializeFirebase(function (app, auth, database, storage) { // Initialize Realtime Database

    let currentUser = null;

    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user; // Set currentUser to the signed-in user
        } else {
            window.location.href = "/admin";
            document.getElementById("uid").innerText = "No user logged in";
        }
    });



    // Fetch the language code from the URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const languageName = urlParams.get('lang');

    if (languageName) {
        document.getElementById('language-name').textContent = languageName;  // Show language name
        loadKeywords(languageName);
    }

    function loadKeywords(languageName) {
        // Load keywords for the selected language
        fetchAndDisplayKeywords(languageName);
    }

    async function fetchAndDisplayKeywords(languageName) {
        try {
            // Get the reference to the languageKeywords node in Firebase
            const languageKeywordsRef = ref(database, 'data/languageKeywords');
            const snapshot = await get(languageKeywordsRef);

            if (!snapshot.exists()) {
                return;
            }

            const languageKeywords = snapshot.val();
            const tableBody = document.querySelector("#keywords-table tbody");
            tableBody.innerHTML = ""; // Clear any existing rows

            // Check if the specific language exists
            if (languageKeywords[languageName]) {
                const modules = languageKeywords[languageName];

                // Iterate over each module in the language
                for (const moduleName in modules) {
                    const keywords = modules[moduleName];

                    // Iterate over each keyword in the module and add a row for it
                    for (const keyword in keywords) {
                        const row = document.createElement("tr");

                        // Create cells for the module, keyword, translation, and action
                        const moduleCell = document.createElement("td");
                        moduleCell.textContent = moduleName;
                        const keywordCell = document.createElement("td");
                        keywordCell.textContent = keyword;
                        const translationCell = document.createElement("td");
                        translationCell.textContent = keywords[keyword]; // Assuming the translation is stored here
                        const actionCell = document.createElement("td");

                        // Edit Button
                        const editButton = document.createElement("button");
                        editButton.textContent = "Edit";
                        editButton.classList.add("btn", "btn-sm", "btn-primary", "me-2");
                        editButton.onclick = () => openEditModal(languageName, moduleName, keyword, keywords[keyword]);

                        // Delete Button
                        const deleteButton = document.createElement("button");
                        deleteButton.textContent = "Delete";
                        deleteButton.classList.add("btn", "btn-sm", "btn-danger");
                        deleteButton.onclick = () => deleteKeyword(languageName, moduleName, keyword);

                        // Append buttons to action cell
                        actionCell.appendChild(editButton);
                        actionCell.appendChild(deleteButton);

                        // Append the cells to the row
                        row.appendChild(moduleCell);
                        row.appendChild(keywordCell);
                        row.appendChild(translationCell);
                        row.appendChild(actionCell);

                        // Append the row to the table body
                        tableBody.appendChild(row);
                    }
                }
            } else {
            }

        } catch (error) {
        }
    }

    // Open the Edit Modal and pre-fill the fields
    function openEditModal(language, moduleName, keyword, translation) {
        // Set values of the input fields in the modal
        document.getElementById("editKeyword").value = keyword;
        document.getElementById("editTranslation").value = translation;

        // Store the language, moduleName, and keyword to update later
        document.getElementById("saveChanges").onclick = () => saveChanges(language, moduleName, keyword);

        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('editModal'));
        modal.show();
    }

    // Save the changes after editing
    async function saveChanges(language, moduleName, oldKeyword) {
        const newKeyword = document.getElementById("editKeyword").value;
        const newTranslation = document.getElementById("editTranslation").value;

        try {
            const languageKeywordsRef = ref(database, 'data/languageKeywords');
            const snapshot = await get(languageKeywordsRef);

            if (!snapshot.exists()) {
                return;
            }

            const languageKeywords = snapshot.val();

            // Check if the data exists for the specific language, module, and keyword
            if (languageKeywords[language] && languageKeywords[language][moduleName] && languageKeywords[language][moduleName][oldKeyword]) {
                // Update the translation for the existing keyword
                languageKeywords[language][moduleName][oldKeyword] = newTranslation;

                // Save the updated data back to Firebase
                await set(ref(database, 'data/languageKeywords'), languageKeywords);
                showToast("Keyword updated successfully!");

                // Reload the table to reflect changes
                fetchAndDisplayKeywords(language);

                // Close the modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
                modal.hide();
            } else {
            }
        } catch (error) {
        }
    }

    // Function to delete a keyword from Firebase
    function deleteKeyword(language, moduleName, keyword) {
        // Open the confirmation modal
        const modal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
        modal.show();

        // Find the confirmation button inside the modal
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

        // Set the confirmation button to trigger the actual delete when clicked
        confirmDeleteBtn.onclick = async function () {
            try {
                const languageKeywordsRef = ref(database, 'data/languageKeywords');
                const snapshot = await get(languageKeywordsRef);

                if (!snapshot.exists()) {
                    return;
                }

                const languageKeywords = snapshot.val();

                // Delete the keyword from the Firebase data structure
                if (languageKeywords[language] && languageKeywords[language][moduleName] && languageKeywords[language][moduleName][keyword]) {
                    delete languageKeywords[language][moduleName][keyword];

                    // Save the updated data back to Firebase
                    await set(ref(database, 'data/languageKeywords'), languageKeywords);
                    showToast("Keyword deleted successfully!");

                    // Reload the table to reflect changes
                    fetchAndDisplayKeywords(language);
                } else {
                }
            } catch (error) {
            } finally {
                // Close the modal after the action is completed
                modal.hide();
            }
        };
    }

    function showToast(message) {
        Toastify({
            text: message,
            duration: 3000, // Duration in milliseconds
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            style: {
                background: "#ff3d00" // Custom background color using style.background
            },
            stopOnFocus: true, // Prevents dismissing of toast on hover
        }).showToast();
    }
});
