import logoBlack from "../assets/lynkn-logo-black-transparent.png";
import logoWhite from "../assets/lynkn-logo-white-transparent.png";
import "./AppLogo.css";

interface AppLogoProps {
  className?: string;
}

const AppLogo = ({ className = "" }: AppLogoProps) => (
  <span className={`app-logo ${className}`} aria-label="LYNKN">
    <img className="app-logo-dark" src={logoWhite} alt="LYNKN" />
    <img className="app-logo-light" src={logoBlack} alt="LYNKN" />
  </span>
);

export default AppLogo;
