const pptxgen = require('pptxgenjs');

// Create a new Presentation
let pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';

// Define slide master/theme colors
pres.defineSlideMaster({
  title: 'MASTER_SLIDE',
  background: { color: 'FFFFFF' },
  objects: [
    { rect: { x: 0, y: 0, w: '100%', h: 0.75, fill: { color: '003366' } } },
    { text: { text: 'Digital Academic Document Workflow System', options: { x: 0.5, y: 0.1, w: 9, h: 0.5, align: 'left', color: 'FFFFFF', fontSize: 18, bold: true } } }
  ],
  slideNumber: { x: 12.5, y: 6.8, color: '000000', fontSize: 10 }
});

// SLIDE 1: Title Slide
let slide1 = pres.addSlide();
slide1.background = { color: '003366' };
slide1.addText('Digital Academic Document Workflow System', {
  x: 1, y: 2, w: '80%', h: 1.5,
  fontSize: 44, bold: true, color: 'FFFFFF', align: 'center', margin: 0
});
slide1.addText('Project Presentation', {
  x: 1, y: 3.5, w: '80%', h: 0.5,
  fontSize: 24, color: 'D3D3D3', align: 'center'
});
slide1.addText('Prepared by:\nGOKUL R\nRoll No: 310624148027\nCourse: 2311CSC503R\nEaswari Engineering College', {
  x: 1, y: 4.5, w: '80%', h: 2,
  fontSize: 18, color: 'FFFFFF', align: 'center', bold: true
});

// SLIDE 2: Problem Statement
let slide2 = pres.addSlide({ masterName: 'MASTER_SLIDE' });
slide2.addText('Problem Statement', { x: 0.5, y: 1.0, fontSize: 32, bold: true, color: '003366' });
slide2.addText([
  { text: 'Manual Process Bottlenecks:', options: { bold: true, bullet: true } },
  { text: 'Students must physically visit multiple departments to get approvals.', options: { bullet: { indent: 30 } } },
  { text: 'Lack of Transparency:', options: { bold: true, bullet: true } },
  { text: 'Students are unaware of the status of their document requests.', options: { bullet: { indent: 30 } } },
  { text: 'Authenticity & Verification Issues:', options: { bold: true, bullet: true } },
  { text: 'Manual signatures can be forged, and physical documents are hard to verify.', options: { bullet: { indent: 30 } } },
  { text: 'Administrative Overhead:', options: { bold: true, bullet: true } },
  { text: 'Paper-based workflows consume time, storage space, and administrative effort.', options: { bullet: { indent: 30 } } }
], { x: 0.5, y: 2.0, w: 12, h: 4, fontSize: 18, color: '333333' });

// SLIDE 3: Proposed Solution
let slide3 = pres.addSlide({ masterName: 'MASTER_SLIDE' });
slide3.addText('Proposed Solution', { x: 0.5, y: 1.0, fontSize: 32, bold: true, color: '003366' });
slide3.addText([
  { text: 'A completely digitized MERN stack web application to manage the entire lifecycle of academic document requests.', options: { bullet: true } },
  { text: 'Dynamic Workflow Automation:', options: { bold: true, bullet: true } },
  { text: 'Automated routing of requests to Class Advisor, HOD, and Dean based on document type.', options: { bullet: { indent: 30 } } },
  { text: 'Automated Document Generation:', options: { bold: true, bullet: true } },
  { text: 'System-generated PDFs with official institutional formatting.', options: { bullet: { indent: 30 } } },
  { text: 'QR Code Verification:', options: { bold: true, bullet: true } },
  { text: 'Embedded QR codes link to a public verification portal to ensure authenticity.', options: { bullet: { indent: 30 } } }
], { x: 0.5, y: 2.0, w: 12, h: 4, fontSize: 18, color: '333333' });

// SLIDE 4: System Architecture (MERN)
let slide4 = pres.addSlide({ masterName: 'MASTER_SLIDE' });
slide4.addText('System Architecture', { x: 0.5, y: 1.0, fontSize: 32, bold: true, color: '003366' });
slide4.addText([
  { text: 'Frontend (Client-Side):', options: { bold: true, bullet: true } },
  { text: 'React.js with Vite for fast performance and modern UI.', options: { bullet: { indent: 30 } } },
  { text: 'React Router for protected, role-based navigation.', options: { bullet: { indent: 30 } } },
  { text: 'Backend (Server-Side):', options: { bold: true, bullet: true } },
  { text: 'Node.js & Express.js for RESTful API development.', options: { bullet: { indent: 30 } } },
  { text: 'Database:', options: { bold: true, bullet: true } },
  { text: 'MongoDB with Mongoose ODM for flexible schema design.', options: { bullet: { indent: 30 } } },
  { text: 'Key Libraries:', options: { bold: true, bullet: true } },
  { text: 'PDFKit (Document Generation), QRCode (Verification), JWT & bcrypt (Security).', options: { bullet: { indent: 30 } } }
], { x: 0.5, y: 2.0, w: 12, h: 4, fontSize: 18, color: '333333' });

// SLIDE 5: Approval Workflow
let slide5 = pres.addSlide({ masterName: 'MASTER_SLIDE' });
slide5.addText('Multi-stage Approval Workflow', { x: 0.5, y: 1.0, fontSize: 32, bold: true, color: '003366' });
slide5.addText('Configurable state-machine workflow based on Document Type:', { x: 0.5, y: 1.8, fontSize: 20, color: '333333' });
slide5.addShape(pres.ShapeType.rightArrow, { x: 0.5, y: 3.0, w: 2, h: 1, fill: '0078D7', line: '003366' });
slide5.addText('Student\nSubmits', { x: 0.5, y: 3.0, w: 2, h: 1, color: 'FFFFFF', align: 'center', bold: true });
slide5.addShape(pres.ShapeType.rightArrow, { x: 3.0, y: 3.0, w: 2, h: 1, fill: '0078D7', line: '003366' });
slide5.addText('Class Advisor\nReviews', { x: 3.0, y: 3.0, w: 2, h: 1, color: 'FFFFFF', align: 'center', bold: true });
slide5.addShape(pres.ShapeType.rightArrow, { x: 5.5, y: 3.0, w: 2, h: 1, fill: '0078D7', line: '003366' });
slide5.addText('HOD\nApproves', { x: 5.5, y: 3.0, w: 2, h: 1, color: 'FFFFFF', align: 'center', bold: true });
slide5.addShape(pres.ShapeType.rightArrow, { x: 8.0, y: 3.0, w: 2, h: 1, fill: '0078D7', line: '003366' });
slide5.addText('Admin/Dean\nFinalizes', { x: 8.0, y: 3.0, w: 2, h: 1, color: 'FFFFFF', align: 'center', bold: true });
slide5.addShape(pres.ShapeType.rect, { x: 10.5, y: 3.0, w: 2, h: 1, fill: '28A745', line: '003366' });
slide5.addText('PDF Gen &\nQR Attached', { x: 10.5, y: 3.0, w: 2, h: 1, color: 'FFFFFF', align: 'center', bold: true });

// SLIDE 6: Key Features Demonstrated
let slide6 = pres.addSlide({ masterName: 'MASTER_SLIDE' });
slide6.addText('Key System Features', { x: 0.5, y: 1.0, fontSize: 32, bold: true, color: '003366' });
slide6.addText([
  { text: 'Role-Based Access Control (RBAC):', options: { bold: true, bullet: true } },
  { text: 'Strict separation of permissions for Students, Advisors, HODs, and Admins.', options: { bullet: { indent: 30 } } },
  { text: 'Real-time Notifications:', options: { bold: true, bullet: true } },
  { text: 'In-app notification center and email alerts (Nodemailer) at every stage.', options: { bullet: { indent: 30 } } },
  { text: 'Dynamic Document Types:', options: { bold: true, bullet: true } },
  { text: 'Admin can create new document types (e.g., Bonafide, NOC) with custom fields.', options: { bullet: { indent: 30 } } },
  { text: 'Public Verification Portal:', options: { bold: true, bullet: true } },
  { text: 'Anyone can scan the document QR code to verify its authenticity instantly.', options: { bullet: { indent: 30 } } }
], { x: 0.5, y: 2.0, w: 12, h: 4, fontSize: 18, color: '333333' });

// SLIDE 7: Conclusion
let slide7 = pres.addSlide({ masterName: 'MASTER_SLIDE' });
slide7.addText('Conclusion & Impact', { x: 0.5, y: 1.0, fontSize: 32, bold: true, color: '003366' });
slide7.addText([
  { text: 'Efficiency:', options: { bold: true, bullet: true } },
  { text: 'Reduces document processing time from days to hours.', options: { bullet: { indent: 30 } } },
  { text: 'Sustainability:', options: { bold: true, bullet: true } },
  { text: 'Promotes a paperless, eco-friendly academic environment.', options: { bullet: { indent: 30 } } },
  { text: 'Security:', options: { bold: true, bullet: true } },
  { text: 'Eliminates document forgery through cryptographically secure QR verification.', options: { bullet: { indent: 30 } } }
], { x: 0.5, y: 2.0, w: 12, h: 4, fontSize: 18, color: '333333' });
slide7.addText('Thank You!\nAny Questions?', { x: 0.5, y: 5.0, w: 12, h: 2, fontSize: 28, bold: true, color: '003366', align: 'center' });

// Save the Presentation
pres.writeFile({ fileName: 'Academic_Document_Workflow_Presentation.pptx' })
  .then(() => {
    console.log('Presentation generated successfully: Academic_Document_Workflow_Presentation.pptx');
  })
  .catch((err) => {
    console.error('Error creating presentation:', err);
  });
