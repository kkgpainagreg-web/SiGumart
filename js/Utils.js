// js/utils.js
// =====================================================
// UTILITY FUNCTIONS
// =====================================================

const Utils = {
    // Generate unique ID
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Format tanggal Indonesia
    formatDate: (date) => {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(date).toLocaleDateString('id-ID', options);
    },

    // Format tanggal pendek
    formatDateShort: (date) => {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(date).toLocaleDateString('id-ID', options);
    },

    // Get nama hari
    getDayName: (dayIndex) => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days[dayIndex];
    },

    // Get nama bulan
    getMonthName: (monthIndex) => {
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return months[monthIndex];
    },

    // Show loading
    showLoading: (message = 'Memuat...') => {
        const loadingEl = document.getElementById('loading-overlay');
        if (loadingEl) {
            loadingEl.querySelector('span').textContent = message;
            loadingEl.classList.remove('hidden');
        }
    },

    // Hide loading
    hideLoading: () => {
        const loadingEl = document.getElementById('loading-overlay');
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }
    },

    // Show notification
    showNotification: (message, type = 'success') => {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : 
                       type === 'error' ? 'bg-red-500' : 
                       type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';
        
        notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('animate-fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    // Confirm dialog
    confirm: (message) => {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                    <p class="text-gray-800 mb-4">${message}</p>
                    <div class="flex justify-end space-x-3">
                        <button class="btn-cancel px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Batal</button>
                        <button class="btn-confirm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Ya</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('.btn-cancel').onclick = () => {
                modal.remove();
                resolve(false);
            };
            modal.querySelector('.btn-confirm').onclick = () => {
                modal.remove();
                resolve(true);
            };
        });
    },

    // Validate NPSN
    validateNPSN: (npsn) => {
        return /^\d{8}$/.test(npsn);
    },

    // Generate Tahun Ajaran
    getTahunAjaran: () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        // Tahun ajaran baru dimulai Juli
        if (month >= 6) {
            return `${year}/${year + 1}`;
        }
        return `${year - 1}/${year}`;
    },

    // Get Semester
    getSemester: () => {
        const month = new Date().getMonth();
        // Semester 1: Juli - Desember, Semester 2: Januari - Juni
        return month >= 6 ? 1 : 2;
    },

    // Convert waktu ke menit
    timeToMinutes: (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    },

    // Check jam bentrok
    isTimeOverlap: (start1, end1, start2, end2) => {
        const s1 = Utils.timeToMinutes(start1);
        const e1 = Utils.timeToMinutes(end1);
        const s2 = Utils.timeToMinutes(start2);
        const e2 = Utils.timeToMinutes(end2);
        return s1 < e2 && s2 < e1;
    },

    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Export to print
    printDocument: (elementId, title) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                <link href="css/print.css" rel="stylesheet">
                <style>
                    @page { size: A4; margin: 2cm; }
                    body { font-family: 'Times New Roman', serif; }
                </style>
            </head>
            <body>
                ${element.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
        };
    }
};

console.log('Utils Loaded');