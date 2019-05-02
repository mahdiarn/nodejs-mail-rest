require('dotenv').config()
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Imap = require('imap');
const inspect = require('util').inspect;
const MailParser = require("mailparser").MailParser;
const simpleParser = require('mailparser').simpleParser;
const nodemailer = require('nodemailer')


const app = express();

app.use(cors());

app.use(bodyParser.json()); // for parsing application/json
// app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


app.get('/',(req,res) => {
    res.send("App is running\n");
});

app.post('/', (req, res) => {
  return res.send('App is running\n');
});

app.post('/mail', (req, res) => {
  console.log('received POST mail')
  const email = req.body.email;
  const password = req.body.password;
  const seqnum = req.body.seqnum;
  const imap = new Imap({
      user: email,
      password: password,
      host: 'imap.gmail.com',
      port: 993,
      tls: true
  });
  let message = {};
  const openInbox = (cb) => {
    imap.openBox('INBOX', true, cb);
  }
  imap.once('ready', function() {     
  
    openInbox(function(err, box) {
        if (err) throw err;
        var f = imap.seq.fetch(seqnum, {
        bodies: ['HEADER', 'TEXT', ''],
        struct: true
        });
        f.on('message', function(msg, seqno) {            
            var prefix = '(#' + seqno + ') ';
            msg.on('body', function(stream, info) {
                var buffer = '';
                stream.on('data', function(chunk) {
                  buffer += chunk.toString('UTF-8');
                  simpleParser(buffer, (err,mail) => {
                    if (mail.text) {
                      if (mail.text.indexOf("----_") === -1) {
                        message.text = mail.text 
                      }                          
                    }                  

                  })
                });
                stream.once('end', function() {
                  if (info.which !== 'TEXT') {
                    const seqnum = seqno;
                    const from = Imap.parseHeader(buffer).from[0];
                    const date = Imap.parseHeader(buffer).date[0];
                    const subject = Imap.parseHeader(buffer).subject[0];
                    message.seqnum = seqnum;
                    message.from = from;
                    message.date = date;
                    message.subject = subject;
                  }
                });
            });
            msg.once('attributes', function(attrs) {              
            });
            msg.once('end', function() {  
            });
        });
        f.once('error', function(err) {
          console.log('error, '+err);
            return res.send('Error dalam pengambilan surel : ' + err);
        });
        f.once('end', function() {                
            imap.end();          
        });
    });
  });
        
  imap.once('error', function(err) {
      return res.send('Error dalam pengambilan surel : ' + err);
  });
    
  imap.once('end', function() {        
    return res.send(message);
  });
    
  imap.connect();  
});

app.post('/mails', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const imap = new Imap({
        user: email,
        password: password,
        host: 'imap.gmail.com',
        port: 993,
        tls: true
    });

    const openInbox = (cb) => {
        imap.openBox('INBOX', true, cb);
    }

    imap.once('ready', function() {        
        openInbox(function(err, box) {
            let messages = [];
            if (err) throw err;
            var f = imap.seq.fetch(box.messages.total-4+':*', {
            bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
            struct: true
            });
            f.on('message', function(msg, seqno) {            
                var prefix = '(#' + seqno + ') ';
                msg.on('body', function(stream, info) {
                    var buffer = '';
                    stream.on('data', function(chunk) {
                    buffer += chunk.toString('UTF-8');
                    });
                    stream.once('end', function() {
                        const seqnum = seqno;
                        const from = Imap.parseHeader(buffer).from[0];
                        const date = Imap.parseHeader(buffer).date[0];
                        const subject = Imap.parseHeader(buffer).subject[0];

                        const message = {
                            seqnum,
                            date,
                            from,
                            subject
                        }
                        messages.push(message);
                    });
                });
                msg.once('attributes', function(attrs) {
                });
                msg.once('end', function() {
                });
            });
            f.once('error', function(err) {
                return res.send('Error dalam pengambilan surel : ' + err);
            });
            f.once('end', function() {                
                imap.end();
                messages = messages.reverse();
                return res.send(messages);
            });
        });
    });
      
    imap.once('error', function(err) {
        return res.send('Error dalam pengambilan surel : ' + err);
    });
      
    imap.once('end', function() {        
    });
      
    imap.connect();
    const response = {
        email,
        password
    }    
});

app.post('/sendmail', (req,res) => {
    const email = req.body.email;
    const password = req.body.password;
    const to = req.body.to;
    const subject = req.body.subject;
    const body = req.body.body;
    const successcode = 1;
    const errcode = 0;

    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: email, // generated ethereal user
          pass: password // generated ethereal password
        }
    });

    transporter.sendMail({
        from: email, // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        text: body, // plain text body
        html: "<p>" + body + "</p>",
      }, (err,info) => {
        if (err)  {
          return res.send({statuscode : errcode});
        } else {
          return res.send({statuscode : successcode});
        }
      }
    );
});

app.listen(process.env.PORT, () => {
    console.log(`App listen on port ${process.env.PORT}`)
});

