'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { APP_METADATA } from '@/constants/app-metadata';
import { cn } from '@/lib/utils';

const APACHE_LICENSE_TEXT = `                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted.
      If You institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   Copyright 2026 APEX Studio

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.5

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.`;

export default function AboutPage() {
  const [licenseOpen, setLicenseOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion() ?? false;
  const yVal = shouldReduceMotion ? 0 : 20;

  const creatorTimeline = {
    outlineEnd: 3,
    nameStart: 3.072,
    nameDuration: 0.96,
    labelDuration: 0.252,
    labelLead: 0.108,
    nameSettleGap: 0.072,
    underlineDuration: 0.81,
    supportGap: 0.084,
    supportDuration: 0.288,
  };

  const creatorMotion = {
    card: { duration: 0.24, delay: 0 },
    outline: { delay: 0, duration: creatorTimeline.outlineEnd },
    label: {
      delay: creatorTimeline.nameStart - creatorTimeline.labelLead - creatorTimeline.labelDuration,
      duration: creatorTimeline.labelDuration
    },
    name: { delay: creatorTimeline.nameStart, duration: creatorTimeline.nameDuration },
    underline: {
      delay: creatorTimeline.nameStart + creatorTimeline.nameDuration + creatorTimeline.nameSettleGap,
      duration: creatorTimeline.underlineDuration
    },
    subtitle: {
      delay: creatorTimeline.nameStart + creatorTimeline.nameDuration + creatorTimeline.nameSettleGap + creatorTimeline.underlineDuration + creatorTimeline.supportGap,
      duration: creatorTimeline.supportDuration
    },
  };

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 md:p-8 pb-0 pl-[calc(1rem+var(--safe-area-left))] pr-[calc(1rem+var(--safe-area-right))]">
      <div className="space-y-6 max-w-xl mx-auto">
        {/* Header */}
        <motion.header
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="text-left select-none"
        >
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground">About</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Creator, brand, and open-source licensing.</p>
        </motion.header>

        {/* Creator Signature Card */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: yVal }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: creatorMotion.card.delay, duration: creatorMotion.card.duration, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="border bg-card/60 backdrop-blur-md shadow-sm rounded-3xl overflow-hidden p-6 sm:p-8 flex flex-col items-center justify-center select-none text-center">
            <motion.span
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: shouldReduceMotion ? 0 : creatorMotion.label.delay, duration: creatorMotion.label.duration, ease: [0.22, 1, 0.36, 1] }}
              className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2"
            >
              Created By
            </motion.span>
            
            <div 
              className="creatorSignatureWrap" 
              aria-label="Subhodeep Rajak"
              style={{
                '--signature-write-delay': `${creatorMotion.outline.delay}s`,
                '--signature-write-duration': `${creatorMotion.outline.duration}s`,
                '--signature-fill-delay': `${creatorMotion.name.delay}s`,
                '--signature-fill-duration': `${creatorMotion.name.duration}s`,
                '--signature-underline-delay': `${creatorMotion.underline.delay}s`,
                '--signature-underline-duration': `${creatorMotion.underline.duration}s`,
              } as React.CSSProperties}
            >
              <svg
                className="creatorSignatureSvg"
                viewBox="0 0 760 150"
                role="img"
                aria-hidden="true"
              >
                <text 
                  className={cn("creatorSignatureGuide", shouldReduceMotion && "animate-none opacity-0")} 
                  x="380" 
                  y="101" 
                  textAnchor="middle"
                  style={shouldReduceMotion ? { animation: 'none', opacity: 0 } : undefined}
                >
                  Subhodeep Rajak
                </text>
                <text 
                  className={cn("creatorSignatureGlow", shouldReduceMotion && "animate-none opacity-0")} 
                  x="380" 
                  y="100" 
                  textAnchor="middle"
                  style={shouldReduceMotion ? { animation: 'none', opacity: 0 } : undefined}
                >
                  Subhodeep Rajak
                </text>
                <text 
                  className={cn("creatorSignatureStroke", shouldReduceMotion && "animate-none")} 
                  x="380" 
                  y="100" 
                  textAnchor="middle"
                  style={shouldReduceMotion ? { animation: 'none', strokeDashoffset: 0, fill: 'var(--flow-ink, hsl(var(--foreground)))', strokeWidth: 0.45, opacity: 1 } : undefined}
                >
                  Subhodeep Rajak
                </text>
              </svg>
            </div>
            <div 
              className={cn("creatorSignatureUnderline", shouldReduceMotion && "animate-none")} 
              style={shouldReduceMotion ? { animation: 'none', transform: 'scaleX(1)', opacity: 1 } : undefined}
            />

            <motion.p
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: shouldReduceMotion ? 0 : creatorMotion.subtitle.delay, duration: creatorMotion.subtitle.duration, ease: [0.22, 1, 0.36, 1] }}
              className="text-xs font-semibold text-muted-foreground mt-4 text-center select-none"
            >
              Founder of <span className="font-bold text-foreground">APEX Studio</span> · Solo Developer
            </motion.p>
          </Card>
        </motion.div>

        {/* APEX Studio Card */}
        <motion.section
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: shouldReduceMotion ? 0 : 0.08, duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          aria-labelledby="apex-studio-heading"
        >
          <Card className="border bg-card/60 backdrop-blur-md shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 select-none">
              <h2 id="apex-studio-heading" className="text-lg font-bold text-foreground leading-none tracking-tight">
                APEX Studio
              </h2>
              <CardDescription className="text-xs text-muted-foreground mt-0.5 font-medium">
                Independent open-source software brand.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-2">
              <dl className="grid grid-cols-[90px_1fr] gap-y-4 gap-x-4 text-xs items-start">
                <dt className="font-medium text-muted-foreground">Founder</dt>
                <dd className="font-bold text-foreground text-right break-words min-w-0">Subhodeep Rajak</dd>
                
                <div className="col-span-2">
                  <Separator className="opacity-50" />
                </div>
                
                <dt className="font-medium text-muted-foreground">Type</dt>
                <dd className="font-bold text-foreground text-right break-words min-w-0">Open-Source Software Brand</dd>
                
                <div className="col-span-2">
                  <Separator className="opacity-50" />
                </div>
                
                <dt className="font-medium text-muted-foreground">Focus</dt>
                <dd className="font-bold text-foreground text-right break-words min-w-0">
                  Applications, Tools & Digital Projects
                </dd>
              </dl>
              <Separator className="opacity-50" />
              <p className="text-xs text-muted-foreground leading-relaxed select-text">
                APEX Studio is an independent open-source software brand founded by Subhodeep Rajak. It serves as the official home for a next-generation ecosystem of solo-developed applications, tools, and digital projects.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* License Card */}
        <motion.section
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: shouldReduceMotion ? 0 : 0.15, duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="border bg-card/60 backdrop-blur-md shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 select-none">
              <CardTitle className="text-lg font-bold">License</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5 font-medium">
                Open-source licensing and project attribution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-2">
              <dl className="grid grid-cols-[90px_1fr] gap-y-4 gap-x-4 text-xs items-start">
                <dt className="font-medium text-muted-foreground">License</dt>
                <dd className="font-bold text-foreground text-right break-words min-w-0">Apache License 2.0</dd>
                
                <div className="col-span-2">
                  <Separator className="opacity-50" />
                </div>
                
                <dt className="font-medium text-muted-foreground">Copyright</dt>
                <dd className="font-bold text-foreground text-right break-words min-w-0">© 2026 APEX Studio</dd>
                
                <div className="col-span-2">
                  <Separator className="opacity-50" />
                </div>
                
                <dt className="font-medium text-muted-foreground">Project Type</dt>
                <dd className="font-bold text-foreground text-right break-words min-w-0">Open-Source Software</dd>
              </dl>
              <Separator className="opacity-50" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Flow is licensed under the Apache License, Version 2.0.
              </p>
              <Separator className="opacity-50" />

              <button
                type="button"
                onClick={() => setLicenseOpen((value) => !value)}
                aria-expanded={licenseOpen}
                aria-controls="apache-license-text"
                className="w-full flex items-center justify-between min-h-[48px] px-4 rounded-2xl bg-muted/30 hover:bg-muted/60 active:bg-muted/70 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all select-none group text-xs font-bold text-foreground"
              >
                <span>{licenseOpen ? 'Hide Complete License' : 'Read Complete License'}</span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", licenseOpen && "rotate-180")} />
              </button>

              <AnimatePresence initial={false}>
                {licenseOpen && (
                  <motion.div
                    id="apache-license-text"
                    initial={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden bg-muted/20 border border-border/40 rounded-2xl text-xs"
                  >
                    <div className="p-3">
                      <pre className="max-h-60 overflow-y-auto font-mono text-[10px] leading-relaxed text-foreground/70 whitespace-pre-wrap break-words w-full pr-1 select-text scrollbar-thin overscroll-contain touch-pan-y">
                        {APACHE_LICENSE_TEXT}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.section>

        {/* Footer */}
        <footer 
          aria-label="Copyright and license information"
          className="text-center pt-8 select-none text-[10px] text-muted-foreground font-medium space-y-1"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)'
          }}
        >
          <p className="leading-normal">Copyright © 2026 APEX Studio.</p>
          <p className="leading-normal">Licensed under the Apache License, Version 2.0.</p>
        </footer>
      </div>
    </div>
  );
}
