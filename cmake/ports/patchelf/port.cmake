include_guard(GLOBAL)

include(CheckCCompilerFlag)
include(CheckCXXCompilerFlag)

if(WIN32)
  set(bin patchelf.exe)
else()
  set(bin patchelf)
endif()

set(c_flags "")

check_c_compiler_flag(--target=${CMAKE_C_COMPILER_TARGET} supports_target)

if(supports_target)
  set(c_flags "${c_flags} --target=${CMAKE_C_COMPILER_TARGET}")
endif()

set(cxx_flags "${c_flags}")

check_cxx_compiler_flag(-static-libstdc++ supports_static_libc++)

if(supports_static_libc++)
  set(cxx_flags "${cxx_flags} -static-libstdc++")
endif()

declare_port(
  "https://github.com/NixOS/patchelf/releases/download/0.18.0/patchelf-0.18.0.tar.gz"
  patchelf
  AUTOTOOLS
  BYPRODUCTS bin/${bin}
  ARGS
    --host=${CMAKE_HOST_SYSTEM_PROCESSOR}-${CMAKE_HOST_SYSTEM_NAME}
  ENV
    "CC=${CMAKE_C_COMPILER}"
    "CFLAGS=${c_flags}"
    "CXX=${CMAKE_CXX_COMPILER}"
    "CXXFLAGS=${cxx_flags}"
)

add_executable(patchelf IMPORTED GLOBAL)

add_dependencies(patchelf ${patchelf})

set_target_properties(
  patchelf
  PROPERTIES
  IMPORTED_LOCATION "${patchelf_PREFIX}/bin/${bin}"
)
