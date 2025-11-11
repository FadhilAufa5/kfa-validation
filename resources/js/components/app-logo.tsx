import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex items-center">
            {/* Logo */}
            <div className="flex aspect-square size-8 items-center justify-center rounded-md 
                bg-transparent dark:bg-transparent">
                <AppLogoIcon className="size-8 object-contain text-gray-800 dark:text-gray-100" />
            </div>

            {/* Text */}
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold 
                    text-gray-800 dark:text-gray-100">
                    KFA Validation
                </span>
            </div>
        </div>
    );
}
