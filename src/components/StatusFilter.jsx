const statuses = [
  { value: 'all', label: 'Все' },
  { value: 'idea', label: 'Идея' },
  { value: 'draft', label: 'Черновик' },
  { value: 'mix', label: 'Микс' },
  { value: 'released', label: 'Релиз' },
];

function StatusFilter({ activeFilter, onFilterChange }) {
  return (
    <div className="status-filter-wrap">
      <div className="section-heading">
        <p className="section-label">Библиотека фильтров</p>
        <h2 className="section-title">Статус трека</h2>
      </div>

      <div className="status-filter">
        {statuses.map(function (status) {
          return (
            <button
              key={status.value}
              type="button"
              className={
                activeFilter === status.value ? 'filter-button active' : 'filter-button'
              }
              onClick={function () {
                onFilterChange(status.value);
              }}
            >
              {status.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default StatusFilter;

