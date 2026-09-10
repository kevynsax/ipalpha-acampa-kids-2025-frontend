import churchLogo from "../assets/church-logo.png";

interface LogoProps {
  size?: number;
  withName?: boolean;
}

export default function Logo({ size = 88, withName = false }: LogoProps) {
  return (
    <div className="logo">
      <img
        src={churchLogo}
        alt="Logo — Igreja Presbiteriana em Alphaville"
        width={size}
        height={size}
        className="logo-img"
      />
      {withName && (
        <span className="logo-name">Igreja Presbiteriana em Alphaville</span>
      )}
    </div>
  );
}
