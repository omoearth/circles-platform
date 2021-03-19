#!/bin/bash
echo "Installing build dependencies .."
npm i
npx --no-install lerna bootstrap || exit

echo "Building 'omo-quirks' .."
cd packages/omo-quirks || exit
npx --no-install tsc || exit
cd .. || exit

echo "Building 'omo-utils' .."
cd omo-utils || exit
npx --no-install tsc || exit
cd .. || exit

echo "Building 'omo-circles' .."
cd omo-circles || exit
npx --no-install tsc || exit
cd .. || exit

echo "Building 'omo-ucan' .."
cd omo-ucan || exit
npx --no-install tsc || exit
cd .. || exit

echo "Building 'omo-central' .."
cd omo-central || exit
npx --no-install tsc || exit
cd .. || exit

echo "Building 'omo-central-server' .."
cd omo-central-server || exit
npx --no-install prisma generate --schema=./schema_template.prisma || exit
npx --no-install tsc || exit
