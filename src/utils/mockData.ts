// Временные mock-данные для работы без БД
// ⚠️ ВНИМАНИЕ: Это временное решение. Включите БД, когда лимиты восстановятся

export const MOCK_USERS = [
  {
    id: 1,
    username: 'admin',
    full_name: 'Главный Администратор',
    badge_number: 'A-0001',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    username: 'moderator1',
    full_name: 'Иван Петров',
    badge_number: 'M-1001',
    role: 'moderator',
    created_at: '2024-02-15T10:30:00Z'
  },
  {
    id: 3,
    username: 'officer1',
    full_name: 'Сергей Волков',
    badge_number: 'B-2001',
    role: 'user',
    created_at: '2024-03-20T14:00:00Z'
  },
  {
    id: 4,
    username: 'officer2',
    full_name: 'Мария Соколова',
    badge_number: 'B-2002',
    role: 'user',
    created_at: '2024-04-10T09:15:00Z'
  }
];

export const MOCK_CITIZENS = [
  {
    id: 1,
    citizen_id: 'ID-00001',
    first_name: 'Александр',
    last_name: 'Иванов',
    date_of_birth: '1985-05-15',
    address: 'ул. Ленина, д. 10, кв. 5',
    phone: '+7 900 123-45-67',
    notes: 'Законопослушный гражданин',
    wanted_count: 0,
    crimes_count: 0,
    fines_count: 0,
    warnings_count: 0
  },
  {
    id: 2,
    citizen_id: 'ID-00002',
    first_name: 'Мария',
    last_name: 'Петрова',
    date_of_birth: '1992-08-20',
    address: 'пр. Победы, д. 25, кв. 12',
    phone: '+7 900 234-56-78',
    notes: '',
    wanted_count: 0,
    crimes_count: 0,
    fines_count: 1,
    warnings_count: 0
  },
  {
    id: 3,
    citizen_id: 'ID-00003',
    first_name: 'Дмитрий',
    last_name: 'Сидоров',
    date_of_birth: '1988-12-03',
    address: 'ул. Советская, д. 7',
    phone: '+7 900 345-67-89',
    notes: 'Владелец сети магазинов',
    wanted_count: 0,
    crimes_count: 1,
    fines_count: 0,
    warnings_count: 1
  },
  {
    id: 4,
    citizen_id: 'ID-00004',
    first_name: 'Игорь',
    last_name: 'Волков',
    date_of_birth: '1995-03-10',
    address: 'ул. Пушкина, д. 15, кв. 8',
    phone: '+7 900 456-78-90',
    notes: 'Неоднократно задерживался',
    wanted_count: 1,
    crimes_count: 2,
    fines_count: 2,
    warnings_count: 2
  }
];

export const MOCK_VEHICLES = [
  {
    id: 1,
    citizen_id: 1,
    plate_number: 'А123БВ777',
    make: 'Toyota',
    model: 'Camry',
    color: 'Черный',
    year: 2020,
    notes: '',
    first_name: 'Александр',
    last_name: 'Иванов',
    phone: '+7 900 123-45-67',
    owner_wanted: 0
  },
  {
    id: 2,
    citizen_id: 2,
    plate_number: 'В456ГД123',
    make: 'Honda',
    model: 'Civic',
    color: 'Белый',
    year: 2019,
    notes: '',
    first_name: 'Мария',
    last_name: 'Петрова',
    phone: '+7 900 234-56-78',
    owner_wanted: 0
  },
  {
    id: 3,
    citizen_id: 3,
    plate_number: 'С789ЕЖ456',
    make: 'BMW',
    model: 'X5',
    color: 'Синий',
    year: 2021,
    notes: 'Служебный автомобиль',
    first_name: 'Дмитрий',
    last_name: 'Сидоров',
    phone: '+7 900 345-67-89',
    owner_wanted: 0
  },
  {
    id: 4,
    citizen_id: 4,
    plate_number: 'К012ЗИ789',
    make: 'Lada',
    model: 'Granta',
    color: 'Серый',
    year: 2015,
    notes: 'Требует техосмотра',
    first_name: 'Игорь',
    last_name: 'Волков',
    phone: '+7 900 456-78-90',
    owner_wanted: 1
  }
];

export const MOCK_PATROLS = [
  {
    id: 1,
    unit_name: 'Альфа-1',
    status: 'available',
    status_reason: '',
    location_name: 'Центральный район',
    officer_1: null,
    officer_2: null,
    vehicle_number: 'П001АБ777',
    officer1_name: null,
    officer1_badge: null,
    officer2_name: null,
    officer2_badge: null
  },
  {
    id: 2,
    unit_name: 'Браво-2',
    status: 'busy',
    status_reason: 'Оформление ДТП',
    location_name: 'Промышленный район',
    officer_1: null,
    officer_2: null,
    vehicle_number: 'П002ВГ777',
    officer1_name: null,
    officer1_badge: null,
    officer2_name: null,
    officer2_badge: null
  },
  {
    id: 3,
    unit_name: 'Чарли-3',
    status: 'on_scene',
    status_reason: 'Задержание нарушителя',
    location_name: 'Северный район',
    officer_1: null,
    officer_2: null,
    vehicle_number: 'П003ДЕ777',
    officer1_name: null,
    officer1_badge: null,
    officer2_name: null,
    officer2_badge: null
  }
];

export const MOCK_CRIMINAL_RECORDS = [
  {
    id: 1,
    citizen_id: 3,
    crime_type: 'Нарушение ПДД',
    description: 'Превышение скорости на 40 км/ч',
    date_committed: '2024-01-15',
    severity: 'minor',
    status: 'closed'
  },
  {
    id: 2,
    citizen_id: 4,
    crime_type: 'Хулиганство',
    description: 'Нарушение общественного порядка в парке',
    date_committed: '2024-06-10',
    severity: 'moderate',
    status: 'active'
  }
];

export const MOCK_FINES = [
  {
    id: 1,
    citizen_id: 2,
    amount: 1500,
    reason: 'Парковка в неположенном месте',
    status: 'unpaid',
    issued_at: '2024-10-15T10:30:00Z'
  },
  {
    id: 2,
    citizen_id: 4,
    amount: 5000,
    reason: 'Превышение скорости',
    status: 'unpaid',
    issued_at: '2024-09-20T14:20:00Z'
  },
  {
    id: 3,
    citizen_id: 4,
    amount: 2000,
    reason: 'Проезд на красный свет',
    status: 'unpaid',
    issued_at: '2024-08-05T16:45:00Z'
  }
];

export const MOCK_WARNINGS = [
  {
    id: 1,
    citizen_id: 3,
    warning_text: 'Предупреждение за шумное поведение в ночное время',
    issued_at: '2024-07-12T22:00:00Z'
  },
  {
    id: 2,
    citizen_id: 4,
    warning_text: 'Предупреждение за нецензурную брань в общественном месте',
    issued_at: '2024-05-18T15:30:00Z'
  }
];

export const MOCK_WANTED = [
  {
    id: 1,
    citizen_id: 4,
    reason: 'Неоплаченные штрафы на сумму 7000 рублей',
    added_at: '2024-11-01T09:00:00Z',
    first_name: 'Игорь',
    last_name: 'Волков',
    date_of_birth: '1995-03-10'
  }
];

export const MOCK_STATS = {
  wanted_citizens: 1,
  active_patrols: 3,
  unpaid_fines: 3
};

// Функция для получения деталей гражданина с mock-данными
export const getMockCitizenDetails = (citizenId: number) => {
  const citizen = MOCK_CITIZENS.find(c => c.id === citizenId);
  if (!citizen) return null;

  return {
    ...citizen,
    criminalRecords: MOCK_CRIMINAL_RECORDS.filter(r => r.citizen_id === citizenId),
    fines: MOCK_FINES.filter(f => f.citizen_id === citizenId),
    warnings: MOCK_WARNINGS.filter(w => w.citizen_id === citizenId),
    wanted: MOCK_WANTED.filter(w => w.citizen_id === citizenId)
  };
};

// Функция для получения деталей транспорта с mock-данными
export const getMockVehicleDetails = (vehicleId: number) => {
  const vehicle = MOCK_VEHICLES.find(v => v.id === vehicleId);
  if (!vehicle) return null;

  const citizen = MOCK_CITIZENS.find(c => c.id === vehicle.citizen_id);
  return {
    ...vehicle,
    owner: citizen ? {
      id: citizen.id,
      citizen_id: citizen.citizen_id,
      first_name: citizen.first_name,
      last_name: citizen.last_name,
      date_of_birth: citizen.date_of_birth,
      address: citizen.address,
      phone: citizen.phone,
      notes: citizen.notes,
      wanted_count: citizen.wanted_count
    } : null
  };
};