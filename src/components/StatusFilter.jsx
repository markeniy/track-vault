import CustomSelect from './CustomSelect';

function StatusFilter({
  activeFilter,
  onFilterChange,
  sortBy,
  onSortChange,
  activeAudienceFilter,
  onAudienceChange,
}) {
  const statusOptions = [
    { value: 'all', label: '\u0412\u0441\u0435 \u0441\u0442\u0430\u0442\u0443\u0441\u044b' },
    { value: 'idea', label: '\u0418\u0434\u0435\u044f' },
    { value: 'draft', label: '\u0427\u0435\u0440\u043d\u043e\u0432\u0438\u043a' },
    { value: 'mix', label: '\u041c\u0438\u043a\u0441' },
    { value: 'released', label: '\u0420\u0435\u043b\u0438\u0437' },
  ];

  const sortOptions = [
    {
      value: 'newest',
      label: '\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u043d\u043e\u0432\u044b\u0435',
    },
    {
      value: 'oldest',
      label: '\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0441\u0442\u0430\u0440\u044b\u0435',
    },
    {
      value: 'bpm-asc',
      label: 'BPM: \u043f\u043e \u0432\u043e\u0437\u0440\u0430\u0441\u0442\u0430\u043d\u0438\u044e',
    },
    {
      value: 'bpm-desc',
      label: 'BPM: \u043f\u043e \u0443\u0431\u044b\u0432\u0430\u043d\u0438\u044e',
    },
    { value: 'title-asc', label: '\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435: \u0410-\u042f' },
    { value: 'title-desc', label: '\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435: \u042f-\u0410' },
  ];

  const audienceOptions = [
    { value: 'all', label: '\u0412\u0441\u0435 \u0437\u0430\u043c\u0435\u0442\u043a\u0438' },
    {
      value: 'mine',
      label: '\u0422\u043e\u043b\u044c\u043a\u043e \u043c\u043e\u0438',
    },
    {
      value: 'public',
      label: '\u041f\u0443\u0431\u043b\u0438\u0447\u043d\u044b\u0435',
    },
  ];

  return (
    <div className="status-filter-wrap">
      <div className="section-heading">
        <p className="section-label">
          {'\u0411\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u043a\u0430 \u0444\u0438\u043b\u044c\u0442\u0440\u043e\u0432'}
        </p>
        <h2 className="section-title">
          {'\u0424\u0438\u043b\u044c\u0442\u0440\u044b \u0438 \u043f\u043e\u0440\u044f\u0434\u043e\u043a \u0432\u044b\u0434\u0430\u0447\u0438'}
        </h2>
      </div>

      <div className="filter-select-grid">
        <CustomSelect
          id="track-status-filter"
          name="track-status-filter"
          value={activeFilter}
          onChange={onFilterChange}
          options={statusOptions}
          label={'\u0421\u0442\u0430\u0442\u0443\u0441 \u0442\u0440\u0435\u043a\u0430'}
        />

        <CustomSelect
          id="track-sort-filter"
          name="track-sort-filter"
          value={sortBy}
          onChange={onSortChange}
          options={sortOptions}
          label={'\u041f\u043e\u0440\u044f\u0434\u043e\u043a \u0441\u043f\u0438\u0441\u043a\u0430'}
        />

        <CustomSelect
          id="track-audience-filter"
          name="track-audience-filter"
          value={activeAudienceFilter}
          onChange={onAudienceChange}
          options={audienceOptions}
          label={'\u0418\u0441\u0442\u043e\u0447\u043d\u0438\u043a \u0437\u0430\u043c\u0435\u0442\u043e\u043a'}
        />
      </div>
    </div>
  );
}

export default StatusFilter;
