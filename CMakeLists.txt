cmake_minimum_required(VERSION 3.25)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)
find_package(cmake-ports REQUIRED PATHS node_modules/cmake-ports)

project(bare_kit)

bare_target(target)

find_port(patchelf)

install(
  IMPORTED_RUNTIME_ARTIFACTS patchelf
  DESTINATION ${target}
)
