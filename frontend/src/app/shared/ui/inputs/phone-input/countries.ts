export interface Country {
    code: string;
    dialCode: string;
    flag: string;
    name: string;
    nameRu: string;
    format: string;
}

export const COUNTRIES: Country[] = [
    { code: "UZ", dialCode: "+998", flag: "\u{1F1FA}\u{1F1FF}", name: "Uzbekistan", nameRu: "\u0423\u0437\u0431\u0435\u043A\u0438\u0441\u0442\u0430\u043D", format: "XX XXX XX XX" },
    { code: "RU", dialCode: "+7", flag: "\u{1F1F7}\u{1F1FA}", name: "Russia", nameRu: "\u0420\u043E\u0441\u0441\u0438\u044F", format: "XXX XXX XX XX" },
    { code: "KZ", dialCode: "+7", flag: "\u{1F1F0}\u{1F1FF}", name: "Kazakhstan", nameRu: "\u041A\u0430\u0437\u0430\u0445\u0441\u0442\u0430\u043D", format: "XXX XXX XX XX" },
    { code: "KG", dialCode: "+996", flag: "\u{1F1F0}\u{1F1EC}", name: "Kyrgyzstan", nameRu: "\u041A\u0438\u0440\u0433\u0438\u0437\u0438\u044F", format: "XXX XXX XXX" },
    { code: "TJ", dialCode: "+992", flag: "\u{1F1F9}\u{1F1EF}", name: "Tajikistan", nameRu: "\u0422\u0430\u0434\u0436\u0438\u043A\u0438\u0441\u0442\u0430\u043D", format: "XX XXX XX XX" },
    { code: "TM", dialCode: "+993", flag: "\u{1F1F9}\u{1F1F2}", name: "Turkmenistan", nameRu: "\u0422\u0443\u0440\u043A\u043C\u0435\u043D\u0438\u0441\u0442\u0430\u043D", format: "XX XXXXXX" },
    { code: "AZ", dialCode: "+994", flag: "\u{1F1E6}\u{1F1FF}", name: "Azerbaijan", nameRu: "\u0410\u0437\u0435\u0440\u0431\u0430\u0439\u0434\u0436\u0430\u043D", format: "XX XXX XX XX" },
    { code: "GE", dialCode: "+995", flag: "\u{1F1EC}\u{1F1EA}", name: "Georgia", nameRu: "\u0413\u0440\u0443\u0437\u0438\u044F", format: "XXX XX XX XX" },
    { code: "BY", dialCode: "+375", flag: "\u{1F1E7}\u{1F1FE}", name: "Belarus", nameRu: "\u0411\u0435\u043B\u0430\u0440\u0443\u0441\u044C", format: "XX XXX XX XX" },
    { code: "UA", dialCode: "+380", flag: "\u{1F1FA}\u{1F1E6}", name: "Ukraine", nameRu: "\u0423\u043A\u0440\u0430\u0438\u043D\u0430", format: "XX XXX XX XX" },
    { code: "TR", dialCode: "+90", flag: "\u{1F1F9}\u{1F1F7}", name: "Turkey", nameRu: "\u0422\u0443\u0440\u0446\u0438\u044F", format: "XXX XXX XX XX" },
    { code: "AE", dialCode: "+971", flag: "\u{1F1E6}\u{1F1EA}", name: "UAE", nameRu: "\u041E\u0410\u042D", format: "XX XXX XXXX" },
    { code: "SA", dialCode: "+966", flag: "\u{1F1F8}\u{1F1E6}", name: "Saudi Arabia", nameRu: "\u0421\u0430\u0443\u0434. \u0410\u0440\u0430\u0432\u0438\u044F", format: "XX XXX XXXX" },
    { code: "US", dialCode: "+1", flag: "\u{1F1FA}\u{1F1F8}", name: "United States", nameRu: "\u0421\u0428\u0410", format: "XXX XXX XXXX" },
    { code: "GB", dialCode: "+44", flag: "\u{1F1EC}\u{1F1E7}", name: "United Kingdom", nameRu: "\u0412\u0435\u043B\u0438\u043A\u043E\u0431\u0440\u0438\u0442\u0430\u043D\u0438\u044F", format: "XXXX XXXXXX" },
    { code: "DE", dialCode: "+49", flag: "\u{1F1E9}\u{1F1EA}", name: "Germany", nameRu: "\u0413\u0435\u0440\u043C\u0430\u043D\u0438\u044F", format: "XXX XXXXXXXX" },
    { code: "CN", dialCode: "+86", flag: "\u{1F1E8}\u{1F1F3}", name: "China", nameRu: "\u041A\u0438\u0442\u0430\u0439", format: "XXX XXXX XXXX" },
    { code: "IN", dialCode: "+91", flag: "\u{1F1EE}\u{1F1F3}", name: "India", nameRu: "\u0418\u043D\u0434\u0438\u044F", format: "XXXXX XXXXX" },
    { code: "KR", dialCode: "+82", flag: "\u{1F1F0}\u{1F1F7}", name: "South Korea", nameRu: "\u042E\u0436\u043D\u0430\u044F \u041A\u043E\u0440\u0435\u044F", format: "XX XXXX XXXX" },
    { code: "PL", dialCode: "+48", flag: "\u{1F1F5}\u{1F1F1}", name: "Poland", nameRu: "\u041F\u043E\u043B\u044C\u0448\u0430", format: "XXX XXX XXX" },
];

export const DEFAULT_COUNTRY: Country = COUNTRIES[0];
