const { withPodfile } = require('@expo/config-plugins');

/**
 * Apple Clang 21 rejects fmt 11's consteval macro expansion used by React
 * Native 0.81. This is run after every pod install so the generated Pods copy
 * is repaired reproducibly; it does not change product code or relax runtime
 * validation.
 */
module.exports = function withXcode27FmtFix(config) {
  return withPodfile(config, (mod) => {
    const marker = '# HOVIN_XCODE27_FMT_CONSTEVAL_FIX';
    const hook = `
    ${marker}
    fmt_base = File.join(__dir__, 'Pods', 'fmt', 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      fmt_source = File.read(fmt_base)
      fmt_fixed = fmt_source.gsub(
        '#elif defined(__apple_build_version__) && __apple_build_version__ < 14000029L',
        '#elif defined(__apple_build_version__)'
      )
      if fmt_fixed != fmt_source
        File.chmod(0644, fmt_base)
        File.write(fmt_base, fmt_fixed)
        File.chmod(0444, fmt_base)
      end
    end
`;

    const existingHook = /\n    # HOVIN_XCODE27_FMT_CONSTEVAL_FIX[\s\S]*?\n    end\n(?=  end\nend\n)/;
    if (existingHook.test(mod.modResults.contents)) {
      mod.modResults.contents = mod.modResults.contents.replace(existingHook, hook);
      return mod;
    }

    const needle = '    )\n  end\nend\n';
    if (!mod.modResults.contents.includes(needle)) {
      throw new Error('Unable to apply HOVIN Xcode 27 fmt compatibility hook');
    }
    mod.modResults.contents = mod.modResults.contents.replace(needle, `    )${hook}  end\nend\n`);
    return mod;
  });
};
