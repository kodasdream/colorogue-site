/*
 * ColoRogue site: two small behaviours, both optional.
 *
 * 1. Copy buttons next to a contact (the Discord name). The label reads Copied
 *    in green, or Could not copy in red, for a moment.
 * 2. Screenshots open in a native <dialog> at full size. Without JS the
 *    images are still there, just not enlarged.
 */
(function () {
  'use strict';

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (err) {
      return false;
    }
  }

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    var label = btn.querySelector('.copy-label');
    var idle = btn.getAttribute('data-label') || 'Copy';
    var timer = null;
    btn.addEventListener('click', function () {
      copyText(btn.getAttribute('data-copy')).then(function (ok) {
        btn.classList.toggle('is-copied', ok);
        btn.classList.toggle('is-failed', !ok);
        if (label) label.textContent = ok ? 'Copied' : 'Could not copy';
        clearTimeout(timer);
        timer = setTimeout(function () {
          btn.classList.remove('is-copied', 'is-failed');
          if (label) label.textContent = idle;
        }, 1800);
      });
    });
  });

  var dialog = document.getElementById('lightbox');
  var img = document.getElementById('lightbox-img');
  var cap = document.getElementById('lightbox-cap');

  if (dialog && img && typeof dialog.showModal === 'function') {
    document.querySelectorAll('.shot-open[data-full]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        img.src = btn.getAttribute('data-full');
        img.alt = btn.querySelector('img') ? btn.querySelector('img').alt : '';
        cap.textContent = btn.getAttribute('data-caption') || '';
        dialog.showModal();
      });
    });

    // A click on the dimmed backdrop, outside the slab, closes the dialog.
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });

    dialog.addEventListener('close', function () {
      img.removeAttribute('src');
    });
  }
})();
