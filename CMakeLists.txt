cmake_minimum_required(VERSION 3.25)

find_package(cmake-ports REQUIRED PATHS node_modules/cmake-ports)

project(bare_kit)

find_port(patchelf)
