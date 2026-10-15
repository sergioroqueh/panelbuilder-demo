/* Identificador del despliegue web. Nunca modifica el proyecto ni lee sus datos. */
(() => {
  'use strict';
  if (!/^https?:$/.test(window.location.protocol)) return;
  const label = document.getElementById('pagesPreviewStatus');
  const link = document.getElementById('pagesCommitLink');
  if (!label || !link) return;
  fetch('./build-info.json', {cache:'no-store'})
    .then(response => response.ok ? response.json() : null)
    .then(info => {
      if (!info || typeof info.sha !== 'string' || !/^[a-f0-9]{40}$/i.test(info.sha)) return;
      label.textContent = 'Web v0.11 · ' + info.sha.slice(0,7);
      if (typeof info.deployedAt === 'string') {
        const date = new Date(info.deployedAt);
        if (!Number.isNaN(date.getTime())) {
          label.title = 'Despliegue: ' + date.toLocaleString('es-ES');
        }
      }
      link.href = 'https://github.com/sergioroqueh/panelbuilder-dev/commit/' + info.sha;
      link.hidden = false;
    })
    .catch(() => { /* Sin metadatos: editor funcional sin cambio de estado. */ });
})();
