const Imap = require('imap');
const simpleParser = require('mailparser').simpleParser;
const MailParser = require("mailparser").MailParser;

const email = 'mahdiarnaufal@gmail.com';
const password = 'mahdiarnaufal13';
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
      var f = imap.seq.fetch('10568', {
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
                  if (mail.text && (mail.text.indexOf("----_") === -1)) {                    
                    message.text = mail.text
                  }                  
                  console.log(mail.text)
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
        console.log('Error dalam pengambilan surel : ' + err);
      });
      f.once('end', function() {                
          imap.end();          
      });
  });
});
      
imap.once('error', function(err) {
  console.log('Error dalam pengambilan surel : ' + err);
});
  
imap.once('end', function() {        
  console.log(message)
});
  
imap.connect();  