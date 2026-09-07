import i18n from "i18next";

i18n.init({
    fallbackLng: "en",
    supportedLngs: ["en", "pl"],
    resources: {
        en: {
            translation: {
                Intro: "Generate content using an external AI provider.",

                "Banner.IdleTitle": "Flotiq doesn't provide its own AI model",
                "Banner.IdleBody":
                    "Connect your own provider - works with any OpenAI-compatible API, " +
                    "including OpenAI, Azure OpenAI, Ollama, LM Studio, and OpenRouter.",
                "Banner.DocsLink": "Read our documentation",
                "Banner.TestingTitle": "Testing connection...",
                "Banner.TestingBody":
                    "Sending one test request to {{url}}. This may take up to 5 minutes.",
                "Banner.ActiveTitle": "Active",
                "Banner.ActiveBody":
                    "{{url}} · model {{model}} · last successful test: {{date}}",
                "Banner.FailedTitle": "Failed",

                "Tabs.Settings": "Settings",
                "Tabs.Logs": "Logs",

                "Logs.EmptyTitle": "No events yet",
                "Logs.EmptyBody": "Logs will appear here after your first connection test or the first time AI generates content.",
                "Logs.Today": "Today",
                "Logs.Succeeded": "Succeeded",
                "Logs.Failed": "Failed",
                "Logs.ConnectionTest": "Connection test",
                "Logs.AutoGenerate": "Auto-generate",
                "Logs.ManualGeneration": "Manual generation",
                "Logs.Attempts_one": "{{count}} attempt",
                "Logs.Attempts_other": "{{count}} attempts",
                "Logs.Duration": "{{seconds}} s",

                "Field.EndpointUrl": "Endpoint URL",
                "Field.EndpointUrlHelp": "Your provider's base API address",
                "Field.ApiKey": "API key",
                "Field.ApiKeyHelp":
                    "Stored securely in your Flotiq account's plugin settings",
                "Field.Model": "Model",
                "Field.AutoGenerate": "Auto-generate",
                "Field.AutoGenerateTooltip":
                    "When you save an entry, empty fields will be automatically filled in by AI. " +
                    "Generated content is saved as a draft for your review.",

                "Models.Idle": "Fill in a valid https:// URL and API key to load the model list.",
                "Models.Loading": "Loading models...",
                "Models.Error": "Could not load models: {{error}}",
                "Models.Loaded_one": "{{count}} model available.",
                "Models.Loaded_other": "{{count}} models available.",

                "Validation.Required": "This field is required",
                "Validation.Https": "The URL must start with https://",
                "Validation.InvalidUrl": "This is not a valid URL",
                "Validation.InvalidHost": "The URL must contain a valid host",
                "Validation.ApiKeyRejected":
                    "Check that the key is active and has permission to use the selected model",

                "Modal.WarningTitle": "The configuration test returned warnings",
                "Modal.WarningNote":
                    "Saving will enable the integration despite the warnings above. " +
                    "Files processed by this integration are sent to the external AI provider you configured.",
                "Modal.SaveAnyway": "Save anyway",
                "Modal.BackToSettings": "Back to settings",

                "Toast.Saved": "AI integration saved",
                "Toast.SaveError": "Could not save the settings",
            },
        },
        pl: {
            translation: {
                Intro: "Generuj treści przy pomocy zewnętrznego dostawcy AI.",

                "Banner.IdleTitle": "Flotiq nie udostępnia własnego modelu AI",
                "Banner.IdleBody":
                    "Podłącz własnego dostawcę - integracja działa z każdym API zgodnym " +
                    "z OpenAI, w tym OpenAI, Azure OpenAI, Ollama, LM Studio i OpenRouter.",
                "Banner.DocsLink": "Zobacz dokumentację",
                "Banner.TestingTitle": "Testowanie połączenia...",
                "Banner.TestingBody":
                    "Wysyłamy jedno zapytanie testowe do {{url}}. Może to potrwać do 5 minut.",
                "Banner.ActiveTitle": "Aktywna",
                "Banner.ActiveBody":
                    "{{url}} · model {{model}} · ostatni udany test: {{date}}",
                "Banner.FailedTitle": "Błąd",

                "Tabs.Settings": "Ustawienia",
                "Tabs.Logs": "Historia",

                "Logs.EmptyTitle": "Brak zdarzeń",
                "Logs.EmptyBody": "Historia pojawi się tutaj po pierwszym teście połączenia lub pierwszym wygenerowaniu treści przez AI.",
                "Logs.Today": "Dzisiaj",
                "Logs.Succeeded": "Powodzenie",
                "Logs.Failed": "Błąd",
                "Logs.ConnectionTest": "Test połączenia",
                "Logs.AutoGenerate": "Automatyczne generowanie",
                "Logs.ManualGeneration": "Ręczne generowanie",
                "Logs.Attempts_one": "{{count}} próba",
                "Logs.Attempts_few": "{{count}} próby",
                "Logs.Attempts_many": "{{count}} prób",
                "Logs.Duration": "{{seconds}} s",

                "Field.EndpointUrl": "Adres endpointu",
                "Field.EndpointUrlHelp": "Bazowy adres API Twojego dostawcy",
                "Field.ApiKey": "Klucz API",
                "Field.ApiKeyHelp":
                    "Przechowywany bezpiecznie w ustawieniach pluginu na Twoim koncie Flotiq",
                "Field.Model": "Model",
                "Field.AutoGenerate": "Generuj automatycznie",
                "Field.AutoGenerateTooltip":
                    "Po zapisaniu obiektu puste pola zostaną uzupełnione przez AI. " +
                    "Wygenerowana treść trafia do wersji roboczej.",

                "Models.Idle":
                    "Podaj poprawny adres https:// i klucz API, aby wczytać listę modeli.",
                "Models.Loading": "Wczytywanie modeli...",
                "Models.Error": "Nie udało się wczytać modeli: {{error}}",
                "Models.Loaded_one": "Dostępny {{count}} model.",
                "Models.Loaded_few": "Dostępne {{count}} modele.",
                "Models.Loaded_many": "Dostępnych {{count}} modeli.",

                "Validation.Required": "To pole jest wymagane",
                "Validation.Https": "Adres musi zaczynać się od https://",
                "Validation.InvalidUrl": "To nie jest poprawny adres URL",
                "Validation.InvalidHost": "Adres musi zawierać poprawną domenę",
                "Validation.ApiKeyRejected":
                    "Sprawdź, czy klucz jest aktywny i ma dostęp do wybranego modelu",

                "Modal.WarningTitle": "Test konfiguracji zwrócił ostrzeżenia",
                "Modal.WarningNote":
                    "Zapisanie włączy integrację mimo powyższych ostrzeżeń. " +
                    "Pliki przetwarzane przez tę integrację są wysyłane do skonfigurowanego dostawcy AI.",
                "Modal.SaveAnyway": "Zapisz mimo to",
                "Modal.BackToSettings": "Wróć do ustawień",

                "Toast.Saved": "Zapisano integrację AI",
                "Toast.SaveError": "Nie udało się zapisać ustawień",
            },
        },
    },
});

export default i18n;
