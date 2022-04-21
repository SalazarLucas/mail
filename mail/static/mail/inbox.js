document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Use submit button to POST request an email
  document.querySelector('#compose-form').addEventListener('submit', (event) => send_email(event));

  // By default, load the inbox
  load_mailbox('inbox');
});

function archive(email) {
  fetch(`emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !email.archived
    })
  })
    .then(() => {
      load_mailbox('inbox');
    });
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function create_email_button(email, mailbox) {

  // Create email button and its components
  const button = document.createElement('button');
  const sender = document.createElement('div');
  const subject = document.createElement('div');
  const timestamp = document.createElement('div');

  // Set button components content
  sender.innerHTML = email.sender;
  subject.innerHTML = email.subject;
  timestamp.innerHTML = email.timestamp;

  if (mailbox === 'sent') {
    sender.innerHTML = `To: ${email.recipients}`;
  }

  // Configure button
  if (email.read) {
    button.style.backgroundColor = '#DCDCDC';
  } else {
    button.style.backgroundColor = '#FFFFFF';
  }

  button.append(sender, subject, timestamp);
  button.className = 'email-button';
  button.addEventListener('click', () => load_email(email, mailbox));

  return button;
}

function create_reply_button(email) {
  const button = document.createElement('button');
  button.innerHTML = 'Reply';
  button.className = 'btn btn-primary';
  button.addEventListener('click', () => {
    compose_email();
    document.querySelector('#compose-recipients').value = email.recipients;
  });
}

function load_email(email, mailbox) {
  // Show email view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show email header and body
  document.querySelector('#sender').innerHTML = email.sender;
  document.querySelector('#recipients').innerHTML = email.recipients;
  document.querySelector('#subject').innerHTML = email.subject;
  document.querySelector('#timestamp').innerHTML = email.timestamp;
  document.querySelector('#email-body').innerHTML = email.body;

  // Configure reply button
  const reply_button = document.querySelector('#reply-button').cloneNode(true);
  reply_button.addEventListener('click', () => {
    compose_email();
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = email.subject.startsWith('Re: ') ? email.subject : 'Re: ' + email.subject;
    document.querySelector('#compose-body').value = `\n\n${'_'.repeat(50)}\nOn ${email.timestamp}, ${email.sender} wrote:\n` + email.body;
  });
  document.querySelector('#reply-button').replaceWith(reply_button);

  // Configure archive button
  if (mailbox != 'sent') {
    const archive_button = document.querySelector('#archive-button').cloneNode(true);
    archive_button.style.display = 'inline';

    if (email.archived) {
      archive_button.innerHTML = 'Unarchive';
      archive_button.className = 'btn btn-secondary';
    } else {
      archive_button.innerHTML = 'Archive';
      archive_button.className = 'btn btn-outline-secondary';
    }

    archive_button.addEventListener('click', () => {
      archive(email);
    });

    document.querySelector('#archive-button').replaceWith(archive_button);
  } else {
    document.querySelector('#archive-button').style.display = 'none';
  }

  // Update email to readed
  if (!email.read) {
    fetch(`emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    });
  }
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Send GET request for all emails in mailbox
  fetch(`emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      // Create email buttons
      emails.forEach(email => {
        const email_button = create_email_button(email, mailbox);
        document.querySelector('#emails-view').append(email_button);
      });
    });
}

function send_email(event) {
  // POST request a new email
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
    .then(response => response.json())
    .then(result => {
      load_mailbox('sent');
      console.log(result);
    });

  event.preventDefault();
}