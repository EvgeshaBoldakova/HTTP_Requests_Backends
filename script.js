function DataTable(config) {

    const myTable = document.querySelector(config.parent);
    myTable.innerHTML = "";

    // Creating an add button
    const addButton = document.createElement("button");
    addButton.classList.add("addButton");
    addButton.textContent = "Додати";
    myTable.appendChild(addButton);

    addButton.onclick = function () {
        createModalWindow(config);
    };

    // Creating a table
    const table = document.createElement("table");
    myTable.appendChild(table);

    const thead = document.createElement("thead");
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    table.appendChild(tbody);

    const trHead = document.createElement("tr");

    const thNumber = document.createElement("th");
    thNumber.appendChild(document.createTextNode("№"));
    trHead.appendChild(thNumber);

    // Filling in the table headers
    for (let i = 0; i < config.columns.length; i++) {
        const th = document.createElement("th");
        th.appendChild(document.createTextNode(config.columns[i].title));
        trHead.appendChild(th);
    }
    thead.appendChild(trHead);

    // Pulling data from the API into the table
    getData(tbody, config);
}

// Function for retrieving data from API
function getData(tbody, config) {
    fetch(config.apiUrl)
        .then(response => response.json())
        .then(backendData => {
            const dataArray = Object.entries(backendData.data);

            for (let i = 0; i < dataArray.length; i++) {
                const [id, values] = dataArray[i];

                const trData = document.createElement("tr");

                const tdNumber = document.createElement("td");
                tdNumber.appendChild(document.createTextNode((i + 1).toString()));
                trData.appendChild(tdNumber);

                for (let j = 0; j < config.columns.length; j++) {
                    const td = document.createElement("td");
                    const tableValue = config.columns[j].value;

                    if (typeof tableValue === "function") {
                        if (tableValue(id, values) instanceof HTMLElement) {
                            td.appendChild(tableValue(id, values));
                        } else {
                            td.innerHTML = tableValue(values);
                        }
                    } else {
                        td.innerHTML = values[tableValue];
                    }
                    if (config.columns[j].title === "Колір") {
                        td.innerHTML = "";
                        td.appendChild(getColorLabel(values.color));
                    }
                    trData.appendChild(td);
                }
                tbody.appendChild(trData);
            }
        })
        .catch(error => console.error("Помилка:", error));
}

// Function to create a modal window
function createModalWindow(config, id = null) {

    //A modal window
    const modalWindow = document.createElement("div");
    modalWindow.classList.add("modalWindow");
    document.body.appendChild(modalWindow); // Додаємо його в body
    modalWindow.style.display = "flex";

    //Data entry container
    const inputContainer = document.createElement("div");
    inputContainer.classList.add("inputContainer");
    modalWindow.appendChild(inputContainer);

    // Dynamically adding fields to a container
    config.columns.forEach(column => {
        const inputField = createInputField(column);
        if (inputField) {
            inputContainer.appendChild(inputField);
        }
    });

    // Container for buttons
    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("buttonsContainer");
    modalWindow.appendChild(buttonsContainer);

    // Button to save data
    const saveButton = document.createElement("button");
    saveButton.classList.add("saveButton");
    saveButton.textContent = "Зберегти";
    buttonsContainer.appendChild(saveButton);
    saveButton.onclick = function () {
        if (id === null) {
            addRow(config, modalWindow);
        } else {
            editRow(id, config, modalWindow);
        }
    }

    // Adding handling of pressing the "Enter" key in a modal window
    modalWindow.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            saveButton.click();
        }
    });

    // Button to close the modal window
    const closeButton = document.createElement("button");
    closeButton.classList.add("closeButton");
    closeButton.textContent = "Закрити";
    buttonsContainer.appendChild(closeButton);
    closeButton.onclick = function () {
        closeModalWindow(modalWindow);
    };

    // Highlight filled fields with a green frame
    document.querySelectorAll(".inputField input, .inputField select").forEach(input => {
        input.addEventListener("input", function () {
            if ((input.value !== "" && input.value.trim() !=="") || (input.value === "" && !input.required)) {
                input.style.borderColor = "green";
            }
        });
    });

    // Populate the modal window with data from the row
    if (id !== null) {
        const apiUrl = `${config.apiUrl}/${id}`;
        fetch(apiUrl, { method: "GET" })
            .then(response => response.json())
            .then((response) => {
                const data = response.data;
                modalWindow.querySelectorAll(".inputField input, .inputField select").forEach(input => {
                    const fieldName = input.name;
                    if (data[fieldName] !== undefined) {
                        input.value = data[fieldName];
                    }
                });
            })
            .catch(error => console.error("Помилка при отриманні даних:", error));
    }
}

// Function to add a row
function addRow(config, modalWindow) {
    
    if (isAllFilled(modalWindow)) {
        let formData = {};
        modalWindow.querySelectorAll(".inputField input, .inputField select").forEach(input => {
            formData[input.name] = input.value;
        });

        // Convert the price from text format to numeric format
        if (formData["price"]) {
            formData["price"] = parseFloat(formData["price"]) || 0;
        }

        fetch(config.apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(() => {
                alert("Запис успішно додано!");
                closeModalWindow(modalWindow);
                refreshTable(config);
            })
            .catch(error => console.error("Помилка при додаванні:", error));
    } else {
        alert("Будь ласка, заповніть усі обов’язкові поля!");
    }
}

// Function to check if all fields of a modal window are filled in
function isAllFilled(modalWindow) {
    let allFilled = true;

    modalWindow.querySelectorAll(".inputField input, .inputField select").forEach(input => {
        if ((input.value.trim() === "" && (!input.hasAttribute("required") || input.required)) ||
            ((input.tagName === "SELECT" && input.value === ""))) {
            allFilled = false;
            input.style.borderColor = "red";
        }
    });
    return allFilled;
}

// Function to close a modal window
function closeModalWindow(modalWindow) {
    modalWindow.style.display = "none";
}

// Function for creating data entry fields
function createInputField(column) {
    if (!column.input) return null;

    const inputField = document.createElement("div");
    inputField.classList.add("inputField");

    const inputs = Array.isArray(column.input) ? column.input : [column.input];

    inputs.forEach(inputConfig => {
        const label = document.createElement("label");
        label.textContent = inputConfig.label || column.title;

        let input;

        if (inputConfig.type === "select") {
            // Creating a drop-down list
            input = document.createElement("select");

            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            input.appendChild(defaultOption);

            inputConfig.options.forEach(optionValue => {
                const option = document.createElement("option");
                option.value = String(optionValue);
                option.textContent = String(optionValue);
                input.appendChild(option);
            });
        } else {
            input = document.createElement("input");
            input.type = inputConfig.type || "text";
        }
        input.name = inputConfig.name || column.value;
        inputField.appendChild(label);
        inputField.appendChild(input);
    });
    return inputField;
}

// Age calculation function
function getAge(birthday) {
    const birthDate = new Date(birthday);
    const nowDate = new Date();

    let years = nowDate.getFullYear() - birthDate.getFullYear();
    let months = nowDate.getMonth() - birthDate.getMonth();
    let days = nowDate.getDate() - birthDate.getDate();

    if (days < 0) {
        months--;
        const prevMonthDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), 0);
        days += prevMonthDate.getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }
    return `${years} year(s) ${months} month(s) ${days} day(s)`;
}

// Function for creating a colored label
function getColorLabel(color) {
    const colorLabel = document.createElement("div");
    colorLabel.classList.add("colorLabel");
    colorLabel.style.backgroundColor = color;
    return colorLabel;
}

// Function for creating delete and edit row buttons
function modifyRow(id, config) {

    const container = document.createElement("div");
    container.classList.add("container");

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("deleteButton");
    deleteButton.textContent = "Видалити";
    container.appendChild(deleteButton);
    deleteButton.onclick = function () {
        deleteItem(id, config);
    };

    const editButton = document.createElement("button");
    editButton.classList.add("editButton");
    editButton.textContent = "Редагувати"
    container.appendChild(editButton);
    editButton.onclick = function () {
        createModalWindow(config, id);
    }
    return container;
}

// Function for editing row
function editRow(id, config, modalWindow) {
    if (isAllFilled(modalWindow)) {
        let formData = {};
        modalWindow.querySelectorAll(".inputField input, .inputField select").forEach(input => {
            formData[input.name] = input.value;
        });

        if (formData["price"]) {
            formData["price"] = parseFloat(formData["price"]) || 0;
        }

        fetch(`${config.apiUrl}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(() => {
                alert("Запис успішно змінено!");
                closeModalWindow(modalWindow);
                refreshTable(config);
            })
            .catch(error => console.error("Помилка при редагуванні:", error));
    } else {
        alert("Будь ласка, заповніть усі обов’язкові поля!");
    }
}

// Function to delete a row
function deleteItem(id, config) {
    const apiUrl = `${config.apiUrl}/${id}`;

    fetch(apiUrl, { method: "DELETE" })
        .then(response => response.json())
        .then(() => {
            refreshTable(config);
        })
        .catch(error => console.error("Помилка при видаленні:", error));
}

// Function to update a table
function refreshTable(config) {
    DataTable(config);
}


const config1 = {
    parent: "#usersTable",
    columns: [
        {
            title: "Ім’я",
            value: "name",
            input: { type: "text" }
        },
        {
            title: "Прізвище",
            value: "surname",
            input: { type: "text" }
        },
        {
            title: "Вік",
            value: (user) => getAge(user.birthday),
            input: { type: "date", name: "birthday", label: "День народження" },
        },
        {
            title: "Фото",
            value: (user) => `<img src="${user.avatar}" alt="${user.name} ${user.surname}"/>`,
            input: { type: "url", name: "avatar" }

        },
        { title: "Дії", value: (id) => modifyRow(id, config1) }
    ],
    apiUrl: "https://mock-api.shpp.me/yboldakova/users"
};

DataTable(config1);


const config2 = {
    parent: "#productsTable",
    columns: [
        {
            title: "Назва",
            value: "title",
            input: { type: "text" }
        },
        {
            title: "Ціна",
            value: (product) => `${product.price} ${product.currency}`,
            input: [
                { type: "number", name: "price", label: "Ціна" },
                { type: "select", name: "currency", label: "Валюта", options: ["$", "€", "₴"], required: false }
            ]
        },
        {
            title: "Колір",
            value: (product) => getColorLabel(product.color),
            input: { type: "color", name: "color" }
        },
        { title: "Дії", value: (id) => modifyRow(id, config2)}
    ],
    apiUrl: "https://mock-api.shpp.me/yboldakova/products"
};

DataTable(config2);