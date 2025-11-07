(function () {
  var root = document.getElementById('l4p-dashboard-root');
  if (!root) {
    return;
  }

  var boot = window.l4pDashboard || {};
  var isLoggedIn = !!(boot.currentUser && boot.currentUser.id);

  var panel = document.createElement('div');
  panel.style.padding = '32px';
  panel.style.boxSizing = 'border-box';
  panel.style.fontFamily = "Inter, 'Segoe UI', sans-serif";
  panel.style.maxWidth = '640px';
  panel.style.margin = '40px auto';
  panel.style.background = '#ffffff';
  panel.style.borderRadius = '16px';
  panel.style.boxShadow = '0 24px 60px rgba(15,23,42,0.12)';
  panel.style.textAlign = 'left';
  panel.style.color = '#0f172a';

  var title = document.createElement('h2');
  title.textContent = 'Local 4 Picnic Manager';
  title.style.fontSize = '1.875rem';
  title.style.marginTop = '0';
  title.style.marginBottom = '12px';
  title.style.color = '#0B5CD6';
  panel.appendChild(title);

  var intro = document.createElement('p');
  intro.style.margin = '0 0 16px';
  intro.style.lineHeight = '1.6';
  if (isLoggedIn) {
    intro.innerHTML = 'The premium dashboard assets are not bundled with this snapshot. ' +
      'To load the full SPA interface in wp-admin and on the <code>[l4p_dashboard]</code> shortcode, please compile the front-end bundle first.';
  } else {
    intro.textContent = 'Please log in to view the Local 4 Picnic dashboard.';
  }
  panel.appendChild(intro);

  if (isLoggedIn) {
    var stepsTitle = document.createElement('div');
    stepsTitle.textContent = 'Build steps:';
    stepsTitle.style.fontWeight = '600';
    stepsTitle.style.marginBottom = '8px';
    panel.appendChild(stepsTitle);

    var list = document.createElement('ol');
    list.style.paddingLeft = '20px';
    list.style.margin = '0 0 20px';

    ['cd wp-content/plugins/local-4-picnic-manager', 'npm install', 'npm run build'].forEach(function (text) {
      var li = document.createElement('li');
      li.textContent = text;
      li.style.marginBottom = '6px';
      list.appendChild(li);
    });

    var note = document.createElement('p');
    note.style.margin = '0';
    note.style.fontSize = '0.95rem';
    note.style.lineHeight = '1.6';
    note.innerHTML = 'After the build completes, refresh this page to load the full coordinator & volunteer dashboard. ' +
      'The compiled assets live under <code>local-4-picnic-manager/build</code> and are required for production sites.';

    panel.appendChild(list);
    panel.appendChild(note);
  }

  root.innerHTML = '';
  root.appendChild(panel);
})();
