/* =============================================
   FIREBASE.JS — Sincronização com Firestore
   Observação: substitua firebaseConfig pelos dados do seu projeto.
============================================= */

(function () {
  const firebaseConfig = {
    apiKey: 'COLE_AQUI_SUA_API_KEY',
    authDomain: 'COLE_AQUI_SEU_AUTH_DOMAIN',
    projectId: 'COLE_AQUI_SEU_PROJECT_ID',
    storageBucket: 'COLE_AQUI_SEU_STORAGE_BUCKET',
    messagingSenderId: 'COLE_AQUI_SEU_MESSAGING_SENDER_ID',
    appId: 'COLE_AQUI_SEU_APP_ID'
  };

  const COLLECTION_DEFAULTS = {
    users: typeof USUARIOS !== 'undefined' ? USUARIOS : [],
    employees: typeof DEMO_EMPLOYEES !== 'undefined' ? DEMO_EMPLOYEES : [],
    careers: typeof DEMO_CAREERS !== 'undefined' ? DEMO_CAREERS : [],
    evaluations: typeof DEMO_EVALUATIONS !== 'undefined' ? DEMO_EVALUATIONS : [],
    payrolls: typeof DEMO_PAYROLLS !== 'undefined' ? DEMO_PAYROLLS : []
  };

  let db = null;

  function isConfigured() {
    return Object.values(firebaseConfig).every(value => value && !String(value).startsWith('COLE_AQUI'));
  }

  function setLocalData(key, data) {
    localStorage.setItem(`cp_${key}`, JSON.stringify(data));
  }

  function getDocId(item, collectionName) {
    if (collectionName === 'users') return String(item.id || item.email);
    return String(item.id || `${collectionName}-${Date.now()}`);
  }

  function normalizeCollectionItem(doc, collectionName) {
    const data = doc.data() || {};
    if (!data.id && collectionName !== 'users') data.id = doc.id;
    return data;
  }

  function updateSyncBadge(status, text) {
    const el = document.getElementById('firebase-status');
    if (!el) return;
    el.className = `sync-badge ${status}`;
    el.innerHTML = `<i class="fas fa-database"></i><span>${text}</span>`;
  }

  async function seedCollection(collectionName, items) {
    if (!db) return;
    const batch = db.batch();
    const col = db.collection(collectionName);
    items.forEach(item => {
      const docId = getDocId(item, collectionName);
      batch.set(col.doc(docId), item);
    });
    await batch.commit();
  }

  async function loadCollection(collectionName) {
    if (!db) return [];
    const snap = await db.collection(collectionName).get();
    return snap.docs.map(doc => normalizeCollectionItem(doc, collectionName));
  }

  async function ensureCollection(collectionName) {
    if (!db) return;
    const current = await loadCollection(collectionName);
    if (!current.length) {
      await seedCollection(collectionName, COLLECTION_DEFAULTS[collectionName] || []);
      setLocalData(collectionName, COLLECTION_DEFAULTS[collectionName] || []);
      return;
    }
    setLocalData(collectionName, current);
  }

  window.firebaseSync = {
    enabled: false,
    async init() {
      if (!window.firebase || !window.firebase.firestore) {
        updateSyncBadge('error', 'Firebase indisponível');
        return false;
      }

      if (!isConfigured()) {
        updateSyncBadge('local', 'Modo local (sem Firebase)');
        return false;
      }

      try {
        updateSyncBadge('pending', 'Conectando ao Firebase...');
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        this.enabled = true;

        for (const collectionName of Object.keys(COLLECTION_DEFAULTS)) {
          await ensureCollection(collectionName);
        }

        updateSyncBadge('connected', 'Firebase conectado');
        return true;
      } catch (error) {
        console.error('Erro ao iniciar Firebase:', error);
        this.enabled = false;
        updateSyncBadge('error', 'Erro na conexão Firebase');
        return false;
      }
    },

    async syncCollection(collectionName, items) {
      if (!this.enabled || !db) return false;
      try {
        updateSyncBadge('pending', 'Sincronizando dados...');
        const col = db.collection(collectionName);
        const snapshot = await col.get();
        const batch = db.batch();

        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        (items || []).forEach(item => {
          const docId = getDocId(item, collectionName);
          batch.set(col.doc(docId), item);
        });

        await batch.commit();
        updateSyncBadge('connected', 'Firebase conectado');
        return true;
      } catch (error) {
        console.error(`Erro ao sincronizar ${collectionName}:`, error);
        updateSyncBadge('error', 'Falha ao sincronizar');
        return false;
      }
    },

    async refreshCollection(collectionName) {
      if (!this.enabled || !db) return [];
      const data = await loadCollection(collectionName);
      setLocalData(collectionName, data);
      updateSyncBadge('connected', 'Firebase conectado');
      return data;
    }
  };
})();
