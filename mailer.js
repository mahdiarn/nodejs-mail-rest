const nodemailer = require("nodemailer");

async function main(){

  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'mahdiarnaufal@gmail.com', // generated ethereal user
      pass: 'mahdiarnaufal13' // generated ethereal password
    }
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
      from: '"Fred Foo 👻" <mahdiarnaufal@gmail.com>', // sender address
      to: "mahdiarnaufal@gmail.com", // list of receivers
      subject: "Hello ✔", // Subject line
      text: "Hello world second?", // plain text body
  }, () => {
    if (err)  {
      return res.send(err);
    } else {
      return res.send('success');
    }
      
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

main().catch(console.error);