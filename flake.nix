{
  description = "Dev environment for dodge-god";

  inputs = {
    # Unofficial library of utilities for managing Nix Flakes.
    flake-utils.url = "github:numtide/flake-utils";

    # Nix package set
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = {
    self,
    flake-utils,
    nixpkgs,
  }:
    flake-utils.lib.eachSystem
    (with flake-utils.lib.system; [x86_64-linux x86_64-darwin aarch64-darwin])
    (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      # A Haskell development environment with provided tooling
      devShells.default = let
        # The compiler version to use for development
        compiler-version = "ghc944";
        inherit (pkgs) lib;
        hpkgs = pkgs.haskell.packages.${compiler-version};
        hlib = pkgs.haskell.lib;
        # Haskell and shell tooling
        tools = with hpkgs; [
          haskell-language-server
          ghc
          cabal-install
          cabal-plan
          (hlib.dontCheck ghcid)
          implicit-hie
          fourmolu
        ];
        # System libraries that need to be symlinked
        libraries = with pkgs; [graphviz zlib];
        libraryPath = "${lib.makeLibraryPath libraries}";
      in
        hpkgs.shellFor {
          name = "dev-shell";
          packages = p: [];
          withHoogle = false;
          buildInputs = tools ++ libraries;

          LD_LIBRARY_PATH = libraryPath;
          LIBRARY_PATH = libraryPath;
        };
      formatter = pkgs.alejandra;
    });
}
