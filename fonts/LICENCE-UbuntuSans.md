## Ubuntu Sans and Ubuntu Sans Mono

The game embeds subset copies of **Ubuntu Sans** and **Ubuntu Sans Mono** as WOFF2 data
URIs. See `src/render/fonts.ts` for why, and `src/assets/UbuntuSans-*.woff2` for the files.

Copyright 2010, 2011 Canonical Ltd.

Licensed under the **Ubuntu Font Licence** version 1.0. The full text follows.

---

UBUNTU FONT LICENCE Version 1.0

PREAMBLE

This licence allows the licensed fonts to be used, studied, modified and
redistributed freely. The fonts, including any derivative works, can be
bundled, embedded, and redistributed provided the terms of this licence are
met. The fonts and derivatives, however, cannot be released under any other
licence. The requirement for fonts to remain under this licence does not
require any document created using the fonts or their derivatives to be
published under this licence, as long as the primary purpose of the document
is not to be a vehicle for the fonts.

DEFINITIONS

"Font Software" refers to the set of files released by the Copyright Holder(s)
under this licence and clearly marked as such. This may include source files,
build scripts and documentation.

"Original Version" refers to the collection of Font Software components as
received by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting, or
substituting, in part or in whole, any of the components of the Original
Version, by changing formats or by porting the Font Software to a new
environment.

"Author" refers to any designer, engineer, programmer, technical writer or
other person who contributed to the Font Software.

PERMISSION & CONDITIONS

Permission is hereby granted, free of charge, to any person obtaining a copy
of the Font Software, to use, study, copy, merge, embed, modify, redistribute,
and sell modified and unmodified copies of the Font Software, subject to the
following conditions:

1) Neither the Font Software nor any of its individual components, in
Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy contains
the above copyright notice and this licence. These can be included either as
stand-alone text files, human-readable headers or in the appropriate
machine-readable metadata fields within text or binary files as long as those
fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font Name(s)
unless explicit written permission is granted by the corresponding Copyright
Holder. This restriction only applies to the primary font name as presented
to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any Modified
Version, except to acknowledge the contribution(s) of the Copyright Holder(s)
and the Author(s) or with their explicit written permission.

5) The Font Software, modified or unmodified, in part or in whole, must be
distributed entirely under this licence, and must not be distributed under any
other licence. The requirement for fonts to remain under this licence does not
affect any document created using the Font Software.

TERMINATION

This licence becomes null and void if any of the above conditions are not met.

DISCLAIMER

THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF COPYRIGHT, PATENT,
TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE
FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, INCLUDING ANY GENERAL, SPECIAL,
INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, WHETHER IN AN ACTION OF
CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF THE USE OR INABILITY TO USE
THE FONT SOFTWARE OR FROM OTHER DEALINGS IN THE FONT SOFTWARE.

---

The subsetting applied here is mechanical: glyphs outside the set the interface can draw
were removed and the variable axes pinned to static instances. No outlines were altered, and
the font's own name tables are untouched. The subsets are not distributed under the
reserved names — they are registered with the browser as `ColoRogue Sans` and
`ColoRogue Mono`.
