cmake_minimum_required(VERSION 3.25)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)

project(bare_addon C)

add_library(foo SHARED)

target_sources(
  foo
  PRIVATE
    foo.c
)

set_target_properties(
  foo
  PROPERTIES
  WINDOWS_EXPORT_ALL_SYMBOLS ON
)

add_bare_module(addon INSTALL TARGET foo)

target_sources(
  ${addon}
  PRIVATE
    binding.c
)

target_link_libraries(
  ${addon}
  PRIVATE
    foo
)
