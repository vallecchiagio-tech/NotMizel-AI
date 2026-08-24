export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Intercettazione paese dall'header nativo di Cloudflare Edge
    const country = request.cf?.country || "ITA";
    
    // Determinazione del profilo giuridico
    let geoLegalContext = {
      country_code: country,
      recommended_level: "national",
      tsa_provider: "AgID Accredited TSA (Aruba/InfoCert)",
      legal_framework: "CAD - Codice dell'Amministrazione Digitale (Art. 20)"
    };

    const euCountries = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", "IE", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"];

    if (country === "ITA") {
      geoLegalContext.recommended_level = "national";
      geoLegalContext.tsa_provider = "AgID / InfoCert TSA";
    } else if (euCountries.includes(country)) {
      geoLegalContext.recommended_level = "continental";
      geoLegalContext.tsa_provider = "eIDAS Qualified Trust Service Provider (QTSP)";
      geoLegalContext.legal_framework = "EU Regulation No 910/2014 (eIDAS)";
    } else {
      geoLegalContext.recommended_level = "international";
      geoLegalContext.tsa_provider = "Global Timestamp Authority & Blockchain Anchor";
      geoLegalContext.legal_framework = "WIPO Copyright Treaty / Berne Convention";
    }

    if (url.pathname === "/api/v1/geo-routing") {
      return new Response(JSON.stringify(geoLegalContext), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    return new Response(JSON.stringify({ 
      service: "NotMizel-AI Edge Trust Gateway", 
      geo_context: geoLegalContext 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  },
};
