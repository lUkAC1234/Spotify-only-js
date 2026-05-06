# Localization

Project localization is made for easy integration and usage, there are few rules you need follow:

1. `/locale` directory

    This directory contains folder under language code name which contains namespaces, namespaces are json files, each namespace acts as tiny module that is lazy loaded

2. API usage

    Well, api is also straightforward, designed for raw speed, built using mobx, all you need to do is inject the LocaleService,
    and use `t` function to get the translation output, where `t` function accepts following parameters:
    1. `namespace` - json file inside each locale
    2. `path` - object path "someObject.innerObject.valueKey"
    3. `vars` - this is also very useful for computed properties, if you want inject some value inside the locale string

    ```json
    {
        "some-computed": "Weight is {weight_kg} kg"
    }
    ```

    ```tsx
    const App = observer(() => {
        const locale: LocaleService = inject(LocaleService);
        return (
            <div>
                <span>
                    // Output: "Weight is 25 kg"
                    {locale.t("some-namespace", "some-computed", {
                        weight_kg: 25,
                    })}
                </span>
            </div>
        );
    });
    ```

    You can also access deeply nested namespaces in deep folders like `/root/nest-1/nest-2/namespace-name.json`:

    ```tsx
    const App = observer(() => {
        const locale: LocaleService = inject(LocaleService);
        return (
            <div>
                <span>{locale.t("root/nest-1/nest-2/namespace-name", "some-translation")}</span>
            </div>
        );
    });
    ```

    Class components usage also considered, since reactivity here is done in mobx-react, it doesn't really care if its function or class component,
    all you need is LocaleService instance using injection and using standard t function.

    ```tsx
    @observer
    class App extends Component {
        locale: LocaleService = inject(LocaleService);

        render(): ReactNode {
            return (
                <div>
                    <span>{this.locale.t("root/nest-1/nest-2/namespace-name", "some-translation")}</span>
                </div>
            );
        }
    }
    ```
