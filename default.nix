with import <nixpkgs> { };
stdenv.mkDerivation rec {
  src = ./.;
  pname = "nomore99";
  version = "0.0.1";
  buildInputs = [
    zip
    nodejs
  ];
  buildPhase = ''
    npm i
    npm run build
  '';
  installPhase = ''
    cp web-ext-artifacts/nomore99-${version}.zip $out/nomore99.zip
  '';
}
