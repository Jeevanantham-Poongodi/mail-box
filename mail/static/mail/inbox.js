document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').addEventListener('submit', send_mailbox);
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      
      console.log(emails);
      
      // Render each email
      emails.forEach(email => {
        const emailDiv = document.createElement('div');
        emailDiv.className = 'email-item';
        emailDiv.style.backgroundColor = email.read ? '#e0e0e0': '#fffff';
        
        emailDiv.innerHTML = `
          <strong>From:${email.sender}</strong> <br>
          <strong>Subject:${email.subject}</strong> <br>
          <strong>Time:${email.timestamp}</strong> <br>
          <hr>
        `;

        emailDiv.addEventListener('click', () => view_email(email.id));

        document.querySelector('#emails-view').append(emailDiv);

      });
  })
  .catch(error => console.error('Error loading emails:', error));
}

function send_mailbox(event) {
  event.preventDefault();
  
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      console.log(result);
      load_mailbox('sent');
  });

}

function view_email(id) {

  // Fetch email details
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      console.log(email);
      //Show email view and hide other views
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#email-view').style.display = 'block';
      
      document.querySelector('#email-view').innerHTML = `
        <strong>From: </strong> ${email.sender} <br>
        <strong>To:</strong> ${email.recipients} <br>
        <strong>Subject:</strong> ${email.subject} <br>
        <strong>Timestamp:</strong> ${email.timestamp} <br>
        <hr>
        <p>${email.body}</p>
      `;

      
      if (!email.read) {
        fetch(`/emails/${email.id}`, {
          method : 'PUT',
          body : JSON.stringify({
            read: true
          })
        });
      }

      const archiveBtn = document.createElement('button');
      archiveBtn.innerHTML = email.archived ? "Unarchive" : "Archive";
      archiveBtn.className = email.archived ? "btn-danger" : "btn-success";
      archiveBtn.addEventListener('click', function() {
          fetch(`/emails/${email.id}`) , {
            method: 'PUT',
            body: JSON.stringify({
              archived: !email.archived
            })
          }
          .then(() => { load_mailbox('archive')})
      });
      document.querySelector('#email-view').append(archiveBtn);

      const replyBtn = document.createElement('button');
      replyBtn.innerHTML = "Reply";
      replyBtn.className = "btn-reply";
      replyBtn.addEventListener('click', function () {
        compose_email();

        document.querySelector('#compose-recipients').value = email.sender;
        let subject = email.subject;
        if (subject.split(' ', 1)[0] != "Re:"){
          subject = "Re: " + email.subject;
        }
        document.querySelector('#compose-subject').value = subject;
        document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
      });
      document.querySelector('#email-view').append(replyBtn);
    });
    
}

