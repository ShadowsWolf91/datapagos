/**
 * Script para implementar funcionalidad de búsqueda y filtrado en tablas
 */

document.addEventListener('DOMContentLoaded', function() {
  // Buscar si existe el campo de búsqueda en la página
  const searchInput = document.getElementById('searchInput');
  
  if (searchInput) {
    // Añadir evento de escucha para el campo de búsqueda
    searchInput.addEventListener('keyup', function() {
      const searchTerm = this.value.toLowerCase();
      filterTable(searchTerm);
    });

    // Añadir evento para el selector de filtro si existe
    const filterSelect = document.getElementById('filterSelect');
    if (filterSelect) {
      filterSelect.addEventListener('change', function() {
        filterTable(searchInput.value.toLowerCase());
      });
    }
  }

  /**
   * Función para filtrar la tabla según el término de búsqueda
   * @param {string} searchTerm - Término de búsqueda
   */
  function filterTable(searchTerm) {
    const table = document.querySelector('table');
    const filterSelect = document.getElementById('filterSelect');
    const filterColumn = filterSelect ? parseInt(filterSelect.value) : -1; // -1 significa buscar en todas las columnas
    
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
      let found = false;
      const cells = row.querySelectorAll('td');
      
      // Si hay un filtro de columna seleccionado, buscar solo en esa columna
      if (filterColumn >= 0 && filterColumn < cells.length) {
        const cellText = cells[filterColumn].textContent.toLowerCase();
        found = cellText.includes(searchTerm);
      } else {
        // Buscar en todas las columnas
        cells.forEach(cell => {
          const cellText = cell.textContent.toLowerCase();
          if (cellText.includes(searchTerm)) {
            found = true;
          }
        });
      }
      
      // Mostrar u ocultar la fila según el resultado de la búsqueda
      row.style.display = found ? '' : 'none';
    });
    
    // Mostrar mensaje si no hay resultados
    const noResultsMessage = document.getElementById('noResultsMessage');
    const visibleRows = table.querySelectorAll('tbody tr:not([style*="display: none"])');
    
    if (noResultsMessage) {
      noResultsMessage.style.display = visibleRows.length === 0 ? 'block' : 'none';
    }
  }
});