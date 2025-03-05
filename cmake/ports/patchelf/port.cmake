include_guard(GLOBAL)

if(WIN32)
  set(bin patchelf.exe)
else()
  set(bin patchelf)
endif()

declare_port(
  "https://github.com/NixOS/patchelf/releases/download/0.18.0/patchelf-0.18.0.tar.gz"
  patchelf
  AUTOTOOLS
  BYPRODUCTS bin/${bin}
)

add_executable(patchelf IMPORTED GLOBAL)

add_dependencies(patchelf ${patchelf})

set_target_properties(
  patchelf
  PROPERTIES
  IMPORTED_LOCATION "${patchelf_PREFIX}/bin/${bin}"
)
