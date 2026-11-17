cmake_minimum_required(VERSION 3.25)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)

project(bare_addon C)

add_bare_module(addon INSTALL PRIVACY_MANIFEST PrivacyInfo.xcprivacy)

target_sources(
  ${addon}
  PRIVATE
    binding.c
)
