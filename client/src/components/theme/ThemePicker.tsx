import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { THEME_REGISTRY, type ThemeColors } from '@/themes';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/lib/utils';

export default function ThemePicker() {
  const { themeId, setThemeId } = useThemeStore();
  const darkThemes = THEME_REGISTRY.filter((t) => t.type === 'dark');
  const lightThemes = THEME_REGISTRY.filter((t) => t.type === 'light');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Color theme">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Color theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Dark</DropdownMenuLabel>
          {darkThemes.map((theme) => (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => setThemeId(theme.id)}
              className="flex items-center gap-2"
            >
              <ThemeSwatch colors={theme.colors} />
              <span className="flex-1">{theme.label}</span>
              {themeId === theme.id && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Light</DropdownMenuLabel>
          {lightThemes.map((theme) => (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => setThemeId(theme.id)}
              className="flex items-center gap-2"
            >
              <ThemeSwatch colors={theme.colors} />
              <span className="flex-1">{theme.label}</span>
              {themeId === theme.id && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeSwatch({ colors }: { colors: ThemeColors }) {
  const swatches = [
    colors['--background'],
    colors['--primary'],
    colors['--sidebar'],
    colors['--border'],
  ];

  return (
    <div className={cn('flex h-4 w-6 overflow-hidden rounded border border-border')}>
      {swatches.map((c, i) => (
        <div key={i} className="flex-1" style={{ backgroundColor: `hsl(${c})` }} />
      ))}
    </div>
  );
}
