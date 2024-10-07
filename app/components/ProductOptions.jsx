import { Link, useLocation, useSearchParams, useNavigation } from '@remix-run/react';

export default function ProductOptions({options, selectedVariant}) {
  const {pathname, search} = useLocation();
  const [currentSearchParams] = useSearchParams();
  const navigation = useNavigation();

  const paramsWithDefaults = (() => {
    const defaultParams = new URLSearchParams(currentSearchParams);

    if (!selectedVariant) {
      return defaultParams;
    }

    for (const {name, value} of selectedVariant.selectedOptions) {
      if (!currentSearchParams.has(name)) {
        defaultParams.set(name, value);
      }
    }

    return defaultParams;
  })();

  // Update the in-flight request data from the 'navigation' (if available)
  // to create an optimistic UI that selects a link before the request is completed
  const searchParams = navigation.location
    ? new URLSearchParams(navigation.location.search)
    : paramsWithDefaults;

  return (
    <div className="grid gap-4 mb-6">
      {options.map((option) => {
        if (!option.optionValues.length) {
          return null;
        }

        // Get the currently selected option value
        const currentOptionVal = searchParams.get(option.name);

        return (
          <div
            key={option.name}
            className="flex flex-col flex-wrap mb-4 gap-y-2 last:mb-0"
          >
            <h3 className="whitespace-pre-wrap max-w-prose font-bold text-lead min-w-[4rem]">
              {option.name}
            </h3>

            <div className="flex flex-wrap items-baseline gap-4">
              {option.optionValues.map((value) => {
                // Build a URLSearchParams object from the current search string
                const linkParams = new URLSearchParams(searchParams);
                // Set the option name and value, overwriting any existing values
                linkParams.set(option.name, value.name);

                // Check if the current option value matches the value in the URL parameters
                const isSelected = currentOptionVal === value.name;

                return (
                  <Link
                    key={value.name}
                    to={`${pathname}?${linkParams.toString()}`}
                    preventScrollReset
                    replace
                    className={`leading-none py-1 border-b-[1.5px] cursor-pointer hover:no-underline transition-all duration-200 ${
                      isSelected ? 'border-gray-500 underline' : 'border-neutral-50 no-underline'
                    }`}
                  >
                    {value.name}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}