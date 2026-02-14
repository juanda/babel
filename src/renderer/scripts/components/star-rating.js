/**
 * Componente de calificación por estrellas
 */
const StarRating = (() => {
  const starFilled = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  const starEmpty = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';

  function render(value = 0, { editable = false, size = '', onChange = null } = {}) {
    const container = document.createElement('div');
    container.className = `star-rating ${editable ? '' : 'readonly'} ${size}`;

    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('button');
      star.type = 'button';
      star.className = `star ${i <= value ? 'active' : ''}`;
      star.innerHTML = i <= value ? starFilled : starEmpty;
      star.dataset.value = i;

      if (editable && onChange) {
        star.addEventListener('click', () => {
          onChange(i);
          updateStars(container, i);
        });
        star.addEventListener('mouseenter', () => highlightStars(container, i));
        star.addEventListener('mouseleave', () => updateStars(container, value));
      }

      container.appendChild(star);
    }

    return container;
  }

  function updateStars(container, value) {
    container.querySelectorAll('.star').forEach((star) => {
      const v = parseInt(star.dataset.value);
      star.className = `star ${v <= value ? 'active' : ''}`;
      star.innerHTML = v <= value ? starFilled : starEmpty;
    });
  }

  function highlightStars(container, upTo) {
    container.querySelectorAll('.star').forEach((star) => {
      const v = parseInt(star.dataset.value);
      star.className = `star ${v <= upTo ? 'active' : ''}`;
      star.innerHTML = v <= upTo ? starFilled : starEmpty;
    });
  }

  function display(value = 0, size = 'sm') {
    let html = '<span class="stars-display">';
    for (let i = 1; i <= 5; i++) {
      html += i <= value
        ? '<span>' + starFilled.replace('<svg', '<svg class="icon-sm"') + '</span>'
        : '<span class="star-empty">' + starEmpty.replace('<svg', '<svg class="icon-sm"') + '</span>';
    }
    html += '</span>';
    return html;
  }

  return { render, display };
})();
