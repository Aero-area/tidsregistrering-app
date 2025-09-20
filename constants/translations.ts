export const translations = {
  da: {
    // Navigation
    home: 'Hjem',
    timeEntries: 'Tidsposter',
    reports: 'Rapporter',
    settings: 'Indstillinger',
    
    // Home screen
    stamp: 'STAMP',
    currentPeriod: 'Aktuel periode',
    tapToStart: 'Tryk for at starte din arbejdsdag',
    tapToEnd: 'Tryk igen for at afslutte',
    tapToUpdate: 'Tryk for at opdatere sluttid',
    workingFor: 'Arbejder i',
    totalToday: 'I dag total',
    
    // Time entries
    addEntry: 'Tilføj post',
    editEntry: 'Rediger post',
    deleteEntry: 'Slet post',
    confirmDelete: 'Er du sikker på, at du vil slette denne post?',
    date: 'Dato',
    startTime: 'Starttid',
    endTime: 'Sluttid',
    totalTime: 'Total tid',
    hoursUnit: 'timer',
    
    // Reports
    selectDateRange: 'Vælg datointerval',
    last7Days: 'Sidste 7 dage',
    last30Days: 'Sidste 30 dage',
    lastRollover: 'Sidste rollover',
    exportPDF: 'Eksporter PDF',
    exportCSV: 'Eksporter CSV',
    totalHours: 'Total timer',
    
    // Settings
    rolloverDay: 'Rollover dag',
    timeRounding: 'Tidsafrunding',
    language: 'Sprog',
    danish: 'Dansk',
    english: 'Engelsk',
    none: 'Ingen',
    backup: 'Backup data',
    
    // Common
    save: 'Gem',
    cancel: 'Annuller',
    delete: 'Slet',
    edit: 'Rediger',
    close: 'Luk',
    confirm: 'Bekræft',
    today: 'I dag',
    yesterday: 'I går',
    
    // Login
    login: 'Log ind',
    logout: 'Log ud',
    email: 'E-mail',
    password: 'Adgangskode',
    createAccount: 'Opret konto',
    
    // Time picker
    selectTime: 'Vælg tid',
    startTimeLabel: 'Starttid',
    endTimeLabel: 'Sluttid',
    hoursLabel: 'Timer',
    minutes: 'Minutter',
    add: 'Tilføj',
    continue: 'Fortsæt',
  },
  en: {
    // Navigation
    home: 'Home',
    timeEntries: 'Time Entries',
    reports: 'Reports',
    settings: 'Settings',
    
    // Home screen
    stamp: 'STAMP',
    currentPeriod: 'Current period',
    tapToStart: 'Tap to start your work day',
    tapToEnd: 'Tap again to finish',
    tapToUpdate: 'Tap to update end time',
    workingFor: 'Working for',
    totalToday: 'Today total',
    
    // Time entries
    addEntry: 'Add entry',
    editEntry: 'Edit entry',
    deleteEntry: 'Delete entry',
    confirmDelete: 'Are you sure you want to delete this entry?',
    date: 'Date',
    startTime: 'Start time',
    endTime: 'End time',
    totalTime: 'Total time',
    hoursUnit: 'hours',
    
    // Reports
    selectDateRange: 'Select date range',
    last7Days: 'Last 7 days',
    last30Days: 'Last 30 days',
    lastRollover: 'Last rollover',
    exportPDF: 'Export PDF',
    exportCSV: 'Export CSV',
    totalHours: 'Total hours',
    
    // Settings
    rolloverDay: 'Rollover day',
    timeRounding: 'Time rounding',
    language: 'Language',
    danish: 'Danish',
    english: 'English',
    none: 'None',
    backup: 'Backup data',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    confirm: 'Confirm',
    today: 'Today',
    yesterday: 'Yesterday',
    
    // Login
    login: 'Log in',
    logout: 'Log out',
    email: 'Email',
    password: 'Password',
    createAccount: 'Create account',
    
    // Time picker
    selectTime: 'Select time',
    startTimeLabel: 'Start time',
    endTimeLabel: 'End time',
    hoursLabel: 'Hours',
    minutes: 'Minutes',
    add: 'Add',
    continue: 'Continue',
  },
};

export type TranslationKey = keyof typeof translations.da;