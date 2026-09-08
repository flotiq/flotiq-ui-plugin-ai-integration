import i18n from "i18next";

i18n.init({
    fallbackLng: "en",
    supportedLngs: ["en", "pl"],
    // Every translated string is written with textContent, never innerHTML, so
    // i18next's HTML escaping only turns "/" into "&#x2F;" on screen.
    interpolation: { escapeValue: false },
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
                "Logs.EmptyBody":
                    "Logs will appear here after your first connection test or the first time AI generates content.",
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
                "Field.FlotiqApiKey": "Flotiq API key",
                "Field.FlotiqApiKeyHelp": "A read-only key for this space",
                "Field.Model": "Model",
                "Field.AutoGenerate": "Auto-generate",
                "Field.AutoGenerateTooltip":
                    "When you save an entry, empty fields will be automatically filled in by AI. " +
                    "Generated content is saved as a draft for your review.",

                // Whole-banner messages for the two statuses the mockup calls out.
                "Error.Unauthorized":
                    "401 Unauthorized - the provider rejected your API key. " +
                    "Check that the key is active and has access to the selected model.",
                "Error.NotFound":
                    "HTTP 404 · invalid_endpoint - couldn't connect to the provided URL. " +
                    "Check that the address is correct and the service is available.",
                // The worker's own auth gate - this one never reached the
                // provider, so it is about the Flotiq key, not the AI key.
                "Error.FlotiqUnauthorized":
                    "401 Unauthorized - Flotiq rejected the API key. " +
                    "Check that the key is active and belongs to this space.",

                // Per-field hints shown under the offending input.
                "Validation.EndpointRejected":
                    "Check that the address is correct and the service is available",
                "Validation.ApiKeyRejected":
                    "Check that the key is active and has permission to use the selected model",
                "Validation.ModelRejected":
                    "Check that the model name is correct and accessible",
                "Validation.FlotiqKeyRejected":
                    "Check that the key is active and belongs to this space",

                "Validation.Required": "This field is required",
                "Validation.Https": "The URL must start with https://",
                "Validation.InvalidUrl": "This is not a valid URL",
                "Validation.InvalidHost": "The URL must contain a valid host",
                "Validation.MissingPath":
                    "Add the endpoint path, e.g. /v1/chat/completions - the address is used exactly as entered",

                "Test.EmptyResponse":
                    "The model answered, but returned no title or alt text",
                "Test.TimedOut":
                    "The test timed out - the provider did not answer in time",
                "Test.Unreachable":
                    "Could not reach the integration service - check that it is running",

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
                "Banner.TestingTitle": "Testujemy połączenie...",
                "Banner.TestingBody":
                    "Wysyłamy jedno zapytanie testowe do {{url}}. Może to potrwać do 5 minut.",
                "Banner.ActiveTitle": "Aktywne",
                "Banner.ActiveBody":
                    "{{url}} · model {{model}} · ostatni udany test: {{date}}",
                "Banner.FailedTitle": "Niepowodzenie",

                "Tabs.Settings": "Ustawienia",
                "Tabs.Logs": "Logi",

                "Logs.EmptyTitle": "Brak zdarzeń",
                "Logs.EmptyBody":
                    "Logi pojawią się tutaj po pierwszym teście połączenia lub po pierwszym wygenerowaniu treści przez AI.",
                "Logs.Today": "Dzisiaj",
                "Logs.Succeeded": "Powodzenie",
                "Logs.Failed": "Niepowodzenie",
                "Logs.ConnectionTest": "Test połączenia",
                "Logs.AutoGenerate": "Automatyczne generowanie",
                "Logs.ManualGeneration": "Ręczne generowanie",
                "Logs.Attempts_one": "{{count}} próba",
                "Logs.Attempts_few": "{{count}} próby",
                "Logs.Attempts_many": "{{count}} prób",
                "Logs.Duration": "{{seconds}} s",

                "Field.EndpointUrl": "Endpoint URL",
                "Field.EndpointUrlHelp": "Adres bazowy API dostawcy",
                "Field.ApiKey": "Klucz API",
                "Field.ApiKeyHelp":
                    "Przechowywany bezpiecznie w ustawieniach pluginu na Twoim koncie Flotiq",
                "Field.FlotiqApiKey": "Klucz API Flotiq",
                "Field.FlotiqApiKeyHelp": "Klucz read-only dla tego space",
                "Field.Model": "Model",
                "Field.AutoGenerate": "Generuj automatycznie",
                "Field.AutoGenerateTooltip":
                    "Po zapisaniu obiektu puste pola zostaną uzupełnione przez AI. " +
                    "Wygenerowana treść trafia do wersji roboczej.",

                "Error.Unauthorized":
                    "401 Unauthorized - dostawca odrzucił klucz API. " +
                    "Sprawdź, czy klucz jest aktywny i ma dostęp do wybranego modelu.",
                "Error.NotFound":
                    "HTTP 404 · invalid_endpoint - nie udało się połączyć z podanym adresem URL. " +
                    "Sprawdź, czy adres jest poprawny i czy usługa jest dostępna.",
                "Error.FlotiqUnauthorized":
                    "401 Unauthorized - Flotiq odrzucił klucz API. " +
                    "Sprawdź, czy klucz jest aktywny i należy do tego space.",

                "Validation.EndpointRejected":
                    "Sprawdź, czy adres jest poprawny i czy usługa jest dostępna",
                "Validation.ApiKeyRejected":
                    "Sprawdź, czy klucz jest aktywny i ma uprawnienia do wybranego modelu",
                "Validation.ModelRejected":
                    "Sprawdź, czy nazwa modelu jest poprawna i czy masz do niego dostęp",
                "Validation.FlotiqKeyRejected":
                    "Sprawdź, czy klucz jest aktywny i należy do tego space",

                "Validation.Required": "To pole jest wymagane",
                "Validation.Https": "Adres musi zaczynać się od https://",
                "Validation.InvalidUrl": "To nie jest poprawny adres URL",
                "Validation.InvalidHost": "Adres musi zawierać poprawną domenę",
                "Validation.MissingPath":
                    "Dodaj ścieżkę endpointu, np. /v1/chat/completions - adres jest używany dokładnie tak, jak go wpiszesz",

                "Test.EmptyResponse":
                    "Model odpowiedział, ale nie zwrócił tytułu ani tekstu alternatywnego",
                "Test.TimedOut":
                    "Test przekroczył limit czasu - dostawca nie odpowiedział na czas",
                "Test.Unreachable":
                    "Nie udało się połączyć z usługą integracji - sprawdź, czy działa",

                "Toast.Saved": "Zapisano integrację AI",
                "Toast.SaveError": "Nie udało się zapisać ustawień",
            },
        },
    },
});

export default i18n;
