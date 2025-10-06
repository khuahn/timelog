// DOM elements
const dateInput = document.getElementById('date');
const timeStartInput = document.getElementById('time-start');
const timeEndInput = document.getElementById('time-end');
const totalHoursInput = document.getElementById('total-hours');
const submitBtn = document.getElementById('submit-btn');
const recordsBody = document.getElementById('records-body');
const noRecordsMsg = document.getElementById('no-records');
const paginationContainer = document.getElementById('pagination');

// Set today's date as default
const today = new Date();
const todayFormatted = today.toISOString().split('T')[0];
dateInput.value = todayFormatted;

// Constants
const MAX_RECORDS_PER_PAGE = 10;
const MAX_TOTAL_RECORDS = 120;
let currentPage = 1;
let editingRecordId = null;

// Load records from localStorage or initialize empty array
let records = JSON.parse(localStorage.getItem('workRecords')) || [];

// Calculate total hours when time inputs change
timeStartInput.addEventListener('change', calculateTotalHours);
timeEndInput.addEventListener('change', calculateTotalHours);

function calculateTotalHours() {
    if (timeStartInput.value && timeEndInput.value) {
        const startTime = new Date(`1970-01-01T${timeStartInput.value}`);
        const endTime = new Date(`1970-01-01T${timeEndInput.value}`);
        
        // Handle case where end time is on the next day
        if (endTime < startTime) {
            endTime.setDate(endTime.getDate() + 1);
        }
        
        const diffMs = endTime - startTime;
        const diffHours = diffMs / (1000 * 60 * 60);
        
        totalHoursInput.value = diffHours.toFixed(2);
    } else {
        totalHoursInput.value = '';
    }
}

// Submit new record or update existing one
submitBtn.addEventListener('click', function() {
    // Validate inputs
    if (!dateInput.value || !timeStartInput.value || !timeEndInput.value) {
        alert('Please fill in all fields');
        return;
    }
    
    if (editingRecordId) {
        // Update existing record
        updateRecord(editingRecordId);
    } else {
        // Create new record
        createRecord();
    }
});

function createRecord() {
    const newRecord = {
        id: Date.now(), // Simple unique ID
        date: dateInput.value,
        timeStart: timeStartInput.value,
        timeEnd: timeEndInput.value,
        totalHours: totalHoursInput.value
    };
    
    // Add to beginning of array (newest first)
    records.unshift(newRecord);
    
    // Limit to 120 records
    if (records.length > MAX_TOTAL_RECORDS) {
        records = records.slice(0, MAX_TOTAL_RECORDS);
    }
    
    // Save to localStorage
    localStorage.setItem('workRecords', JSON.stringify(records));
    
    // Reset form
    resetForm();
    
    // Refresh display
    displayRecords();
}

function updateRecord(recordId) {
    // Find the record index
    const recordIndex = records.findIndex(record => record.id === recordId);
    
    if (recordIndex !== -1) {
        // Update the record
        records[recordIndex] = {
            id: recordId,
            date: dateInput.value,
            timeStart: timeStartInput.value,
            timeEnd: timeEndInput.value,
            totalHours: totalHoursInput.value
        };
        
        // Save to localStorage
        localStorage.setItem('workRecords', JSON.stringify(records));
        
        // Reset form and editing state
        resetForm();
        
        // Refresh display
        displayRecords();
    }
}

function resetForm() {
    dateInput.value = todayFormatted;
    timeStartInput.value = '';
    timeEndInput.value = '';
    totalHoursInput.value = '';
    editingRecordId = null;
    submitBtn.textContent = 'Submit Entry';
    submitBtn.classList.remove('btn-update');
}

function editRecord(recordId) {
    // Find the record
    const record = records.find(record => record.id === recordId);
    
    if (record) {
        // Populate form with record data
        dateInput.value = record.date;
        timeStartInput.value = record.timeStart;
        timeEndInput.value = record.timeEnd;
        totalHoursInput.value = record.totalHours;
        
        // Set editing state
        editingRecordId = recordId;
        submitBtn.textContent = 'Update Entry';
        submitBtn.classList.add('btn-update');
    }
}

function deleteRecord(recordId) {
    if (confirm('Are you sure you want to delete this record?')) {
        // Filter out the record to delete
        records = records.filter(record => record.id !== recordId);
        
        // Save to localStorage
        localStorage.setItem('workRecords', JSON.stringify(records));
        
        // Refresh display
        displayRecords();
    }
}

// Display records with pagination
function displayRecords() {
    // Hide/show no records message
    if (records.length === 0) {
        noRecordsMsg.style.display = 'block';
        recordsBody.innerHTML = '';
        paginationContainer.innerHTML = '';
        return;
    } else {
        noRecordsMsg.style.display = 'none';
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(records.length / MAX_RECORDS_PER_PAGE);
    const startIndex = (currentPage - 1) * MAX_RECORDS_PER_PAGE;
    const endIndex = Math.min(startIndex + MAX_RECORDS_PER_PAGE, records.length);
    const pageRecords = records.slice(startIndex, endIndex);
    
    // Clear table body
    recordsBody.innerHTML = '';
    
    // Add records to table
    pageRecords.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(record.date)}</td>
            <td>${record.timeStart}</td>
            <td>${record.timeEnd}</td>
            <td>${record.totalHours}</td>
            <td class="actions-cell">
                <i class="fas fa-edit edit-icon action-icon" data-id="${record.id}" title="Edit"></i>
                <i class="fas fa-trash delete-icon action-icon" data-id="${record.id}" title="Delete"></i>
            </td>
        `;
        recordsBody.appendChild(row);
    });
    
    // Add event listeners to action icons
    document.querySelectorAll('.edit-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const recordId = parseInt(e.target.getAttribute('data-id'));
            editRecord(recordId);
        });
    });
    
    document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const recordId = parseInt(e.target.getAttribute('data-id'));
            deleteRecord(recordId);
        });
    });
    
    // Generate pagination buttons
    generatePaginationButtons(totalPages);
}

// Format date for display (YYYY-MM-DD to MM/DD/YYYY)
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
}

// Generate pagination buttons
function generatePaginationButtons(totalPages) {
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.textContent = '←';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayRecords();
        }
    });
    paginationContainer.appendChild(prevButton);
    
    // Page buttons (show max 5 pages)
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.toggle('active', i === currentPage);
        pageButton.addEventListener('click', () => {
            currentPage = i;
            displayRecords();
        });
        paginationContainer.appendChild(pageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.textContent = '→';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayRecords();
        }
    });
    paginationContainer.appendChild(nextButton);
}

// Initial display
displayRecords();
