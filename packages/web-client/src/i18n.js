const translations = {
    it: {
        title: "NotMizel-AI Trust Suite",
        subtitle: "Cifratura Zero-Knowledge & Notarizzazione",
        btnEncrypt: "Cifra Documento",
        jurisdiction: "Giurisdizione: AgID (Italia)"
    },
    en: {
        title: "NotMizel-AI Trust Suite",
        subtitle: "Zero-Knowledge Encryption & Notarization",
        btnEncrypt: "Encrypt Document",
        jurisdiction: "Jurisdiction: WIPO (International)"
    }
};

function setLanguage(lang) {
    document.getElementById('app-title').innerText = translations[lang].title;
    document.getElementById('app-subtitle').innerText = translations[lang].subtitle;
    document.getElementById('btn-encrypt').innerText = translations[lang].btnEncrypt;
    document.getElementById('jurisdiction-info').innerText = translations[lang].jurisdiction;
    localStorage.setItem('preferred_lang', lang);
}

// Carica la lingua salvata o default
window.onload = () => {
    const savedLang = localStorage.getItem('preferred_lang') || 'it';
    document.getElementById('lang-selector').value = savedLang;
    setLanguage(savedLang);
};
