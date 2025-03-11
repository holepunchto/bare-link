include_guard(GLOBAL)

if(WIN32)
  set(bin patchelf.exe)
else()
  set(bin patchelf)
endif()

set(flags
  --target=${CMAKE_C_COMPILER_TARGET}
)

if(CMAKE_SYSTEM_NAME MATCHES "iOS")
  list(APPEND flags "-isysroot ${CMAKE_OSX_SYSROOT}")
elseif(CMAKE_SYSTEM_NAME MATCHES "Android")
  list(APPEND flags --sysroot=${CMAKE_SYSROOT})
endif()

list(JOIN flags " " flags)

declare_port(
  "https://github.com/NixOS/patchelf/releases/download/0.18.0/patchelf-0.18.0.tar.gz"
  patchelf
  AUTOTOOLS
  BYPRODUCTS bin/${bin}
  ENV
    "CC=${CMAKE_C_COMPILER}"
    "CFLAGS=${flags}"
    "CXX=${CMAKE_CXX_COMPILER}"
    "CXXFLAGS=${flags}"
)

add_executable(patchelf IMPORTED GLOBAL)

add_dependencies(patchelf ${patchelf})

set_target_properties(
  patchelf
  PROPERTIES
  IMPORTED_LOCATION "${patchelf_PREFIX}/bin/${bin}"
)
