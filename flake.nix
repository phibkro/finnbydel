{
  description = "finnbydel — neighborhood marketplace (T3 stack: Next.js + tRPC + Prisma)";

  inputs = {
    lab.url = "github:phibkro/homelab";
    nixpkgs.follows = "lab/nixpkgs";
  };

  outputs =
    { lab, nixpkgs, ... }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
        config.allowUnfree = true;
      };
    in
    {
      devShells.${system}.default = lab.lib.mkDevShell pkgs {
        modules = [
          "ts"
          "nodejs"
          "claude-code"
        ];
      };
    };
}
