const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoice = (booking, dental, user) => {
    const doc = new PDFDocument();

    const invoiceDir=path.join(__dirname,'../invoices');
    if (!fs.existsSync(invoiceDir)){
        fs.mkdirSync(invoiceDir);
    }

    const filePath = path.join(invoiceDir, `../invoices/invoice-${booking.id}.pdf`);
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20).text('Dentist Booking Invoice', { align: 'center' });
    doc.moveDown();

    const bookingDate = new Date(booking.bookingDate);

    // Set timezone to Asia/Bangkok
    const options ={
        timezone: 'Asia/Bangkok',
        weekday: 'short',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };

    const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(bookingDate);

    doc.fontSixe(14).text(`Booking ID: ${booking.id}`);
    doc.text(`Patient Name: ${user.name} (${user.email})`);
    doc.text(`Dentist Name: ${dental.name}`);
    doc.text(`Yeat of Experience: ${dental.yearsOfExperience}`);
    doc.text(`Specialization: ${dental.areaOfExpertise}`);
    doc.text(`Booking Date: ${formattedDate}(Thailand Time)`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);

    return filePath;
    };

module.exports = generateInvoice;
