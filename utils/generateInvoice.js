const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// const generateInvoice = (booking, dentist, user) => {
//     const doc = new PDFDocument();

//     const invoiceDir=path.join(__dirname,'../invoices');
//     if (!fs.existsSync(invoiceDir)){
//         fs.mkdirSync(invoiceDir);
//     }

//     const filePath = path.join(invoiceDir, `../invoices/invoice-${booking.id}.pdf`);
//     doc.pipe(fs.createWriteStream(filePath));

//     doc.fontSize(20).text('Dentist Booking Invoice', { align: 'center' });
//     doc.moveDown();

//     const bookingDate = new Date(booking.bookingDate);

//     // Set timezone to Asia/Bangkok
//     const options ={
//         timezone: 'Asia/Bangkok',
//         weekday: 'short',
//         day: '2-digit',
//         month: 'long',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit',
//         hour12: false
//     };

//     const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(bookingDate);

//     doc.fontSize(14).text(`Booking ID: ${booking.id}`);
//     doc.text(`Patient Name: ${user.name} (${user.email})`);
//     doc.text(`Dentist Name: ${dentist.name}`);
//     doc.text(`Yeat of Experience: ${dentist.yearsOfExperience}`);
//     doc.text(`Specialization: ${dentist.areaOfExpertise}`);
//     doc.text(`Booking Date: ${formattedDate}(Thailand Time)`);
//     doc.text(`Date: ${new Date().toLocaleDateString()}`);

//     doc.end();
    
//     return filePath;
//     };

function drawSectionBox(doc, x, y, w, h, title) {
  doc.save().roundedRect(x, y, w, h, 8).lineWidth(0.8).strokeColor('#E5E7EB').stroke().restore();
  doc.fontSize(12).fillColor('#111827').text(title, x + 12, y + 10);
  doc.moveTo(x, y + 30).lineTo(x + w, y + 30).strokeColor('#E5E7EB').lineWidth(0.7).stroke();
}
function drawLabelValue(doc, x, y, label, value, labelW = 110, lineH = 18) {
  doc.fontSize(10).fillColor('#6B7280').text(label, x, y, { width: labelW });
  doc.fontSize(12).fillColor('#111827').text(value ?? '-', x + labelW + 8, y);
  return y + lineH;
}

const generateInvoice = (booking, dentist, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: { top: 36, left: 36, right: 36, bottom: 72 } });
      const outDir = path.join(__dirname, '..', 'invoices');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

      const bookingId = (booking?._id || booking?.id || '').toString();
      const shortRef  = bookingId ? bookingId.slice(-8).toUpperCase() : 'UNKNOWN';
      const filePath  = path.join(outDir, `booking-confirmation-${bookingId || Date.now()}.pdf`);

      const out = fs.createWriteStream(filePath);
      out.on('finish', () => resolve(filePath));
      out.on('error', reject);
      doc.pipe(out);

      const W = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const X = doc.page.margins.left;
      let y   = doc.page.margins.top;

      // Header
      doc.save().roundedRect(X, y, W, 70, 10).fill('#F3F4F6').restore();
      doc.fontSize(20).fillColor('#111827').text('Booking Confirmation', X + 16, y + 16);
      doc.fontSize(10).fillColor('#6B7280').text(`Reference: ${shortRef}`, X + 16, y + 42);
      const issuedDate = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Bangkok' });
      doc.text(`Issued: ${issuedDate}`, X + 16, y + 58);
      y += 86;

      // Patient / Dentist
      const colW = (W - 12) / 2;
      const boxH = 120;

      drawSectionBox(doc, X, y, colW, boxH, 'Patient');
      let y1 = y + 36;
      y1 = drawLabelValue(doc, X + 12, y1, 'Name',  user?.name || user?.fullName || '-', 70, 16);
      y1 = drawLabelValue(doc, X + 12, y1, 'Email', user?.email || '-', 70, 16);
      y1 = drawLabelValue(doc, X + 12, y1, 'User ID', user?._id || '-', 70, 16);

      drawSectionBox(doc, X + colW + 12, y, colW, boxH, 'Dentist / Clinic');
      let y2 = y + 40;
      y2 = drawLabelValue(doc, X + colW + 24, y2, 'Dentist',    dentist?.name || '-');
      y2 = drawLabelValue(doc, X + colW + 24, y2, 'Specialty',  dentist?.areaOfExpertise ?? '-');
      y2 = drawLabelValue(doc, X + colW + 24, y2, 'Experience', dentist?.yearsOfExperience != null ? `${dentist.yearsOfExperience} years` : '-');
      y2 = drawLabelValue(doc, X + colW + 24, y2, 'Contact',    dentist?.tel || dentist?.phone || '-');

      y += boxH + 16;

      // Appointment
      const apptH = 110;
      drawSectionBox(doc, X, y, W, apptH, 'Appointment');
      let y3 = y + 40;

      const bookingDate = booking?.bookingDate ? new Date(booking.bookingDate) : null;
      const formattedDate = bookingDate
        ? bookingDate.toLocaleString('en-GB', {
            timeZone: 'Asia/Bangkok',
            weekday: 'short',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
        : '-';

      y3 = drawLabelValue(doc, X + 12, y3, 'Reference',       shortRef);
      y3 = drawLabelValue(doc, X + 12, y3, 'Date & Time (TH)', formattedDate);
      y3 = drawLabelValue(doc, X + 12, y3, 'Status',           booking?.status || 'Booked');
      y3 = drawLabelValue(doc, X + 12, y3, 'Notes',            booking?.note || booking?.notes || '-');

      y += apptH + 16;

      // Notes
      const noteH = 90;
      drawSectionBox(doc, X, y, W, noteH, 'Important Notes');
      doc.fontSize(10).fillColor('#111827')
        .text('• Please arrive at least 10 minutes before your appointment and present your booking reference.', X + 12, y + 40, { width: W - 24 })
        .moveDown(0.2)
        .text('• To reschedule or cancel, please notify at least 24 hours in advance.', { width: W - 24 })
        .moveDown(0.2)
        .text('• For directions, parking, or any additional requirements, please contact the clinic directly.', { width: W - 24 });

      // Footer
        const footerBlockH = 42; // ความสูงพื้นที่ footer (2 บรรทัด + ระยะห่าง)
        const footerY = doc.page.height - doc.page.margins.bottom - footerBlockH;

        doc
        .moveTo(X, footerY)
        .lineTo(X + W, footerY)
        .strokeColor('#E5E7EB')
        .lineWidth(0.7)
        .stroke();

        doc.fontSize(9).fillColor('#6B7280')
        .text('This is a booking confirmation. No payment is collected via this document.',
                X, footerY + 8, { width: W, align: 'center' })
        .text('Support: support@example.com | Tel: 02-xxx-xxxx',
                X, footerY + 22, { width: W, align: 'center' });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};


module.exports = generateInvoice;
