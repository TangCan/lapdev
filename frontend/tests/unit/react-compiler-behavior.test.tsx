import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Render Counter Module ────────────────────────────────────────────────────
// Tracks render counts per component instance to verify memoization behavior.
// This simulates the instrumentation that React Compiler would produce at
// compile time when applying compilationMode: 'infer'.

type RenderCounter = {
  count: number;
  reset: () => void;
  getCount: () => number;
};

const createRenderCounter = (): RenderCounter => ({
  count: 0,
  reset() {
    this.count = 0;
  },
  getCount() {
    return this.count;
  },
});

// ─── SimpleComponent ──────────────────────────────────────────────────────────
// A basic component that receives props and renders them.
// React Compiler with compilationMode: 'infer' wraps components like this
// with React.memo automatically. We use React.memo explicitly to simulate
// the compiler's output and verify memoization semantics.

interface SimpleComponentProps {
  title: string;
  value: number;
  renderCounter: RenderCounter;
}

const SimpleComponentBase: React.FC<SimpleComponentProps> = ({
  title,
  value,
  renderCounter,
}) => {
  renderCounter.count += 1;
  return (
    <div data-testid="simple">
      <h1>{title}</h1>
      <span>{value}</span>
    </div>
  );
};

const SimpleComponent = React.memo(SimpleComponentBase);

// ─── MemoComponent ────────────────────────────────────────────────────────────
// Uses useMemo for derived data. React Compiler should automatically optimize
// the memoization of derived values when dependencies are unchanged.
// Wrapped in React.memo to simulate compiler output.

interface MemoComponentProps {
  items: string[];
  renderCounter: RenderCounter;
}

const MemoComponentBase: React.FC<MemoComponentProps> = ({
  items,
  renderCounter,
}) => {
  renderCounter.count += 1;

  const sortedItems = useMemo(() => {
    return [...items].sort();
  }, [items]);

  const totalLength = useMemo(() => {
    return sortedItems.reduce((sum, item) => sum + item.length, 0);
  }, [sortedItems]);

  return (
    <div data-testid="memo">
      <ul>
        {sortedItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <span data-testid="total-length">{totalLength}</span>
    </div>
  );
};

const MemoComponent = React.memo(MemoComponentBase);

// ─── CallbackComponent ────────────────────────────────────────────────────────
// Uses useCallback for event handlers. React Compiler should preserve callback
// identity across renders when dependencies are unchanged.
// Wrapped in React.memo to simulate compiler output.

interface CallbackComponentProps {
  label: string;
  onAction: () => void;
  renderCounter: RenderCounter;
}

const CallbackComponentBase: React.FC<CallbackComponentProps> = ({
  label,
  onAction,
  renderCounter,
}) => {
  renderCounter.count += 1;

  const handleClick = useCallback(() => {
    onAction();
  }, [onAction]);

  return (
    <button data-testid="callback-btn" onClick={handleClick}>
      {label}
    </button>
  );
};

const CallbackComponent = React.memo(CallbackComponentBase);

// ─── BatchedUpdateComponent ──────────────────────────────────────────────────
// Tests React 19's automatic batching behavior with React Compiler.
// Multiple state updates should be batched into a single render.

const BatchedUpdateComponent: React.FC<{
  renderCounter: RenderCounter;
}> = ({ renderCounter }) => {
  renderCounter.count += 1;

  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);
  const [text, setText] = useState('');

  const handleBatchUpdate = useCallback(() => {
    setCount((c) => c + 1);
    setFlag((f) => !f);
    setText((t) => t + 'x');
  }, []);

  return (
    <div data-testid="batched">
      <span data-testid="count">{count}</span>
      <span data-testid="flag">{String(flag)}</span>
      <span data-testid="text">{text}</span>
      <button data-testid="batch-btn" onClick={handleBatchUpdate}>
        Batch
      </button>
    </div>
  );
};

// ─── RuleViolationComponent ───────────────────────────────────────────────────
// Simulates a component with a pattern that React Compiler's Rules of React
// analysis would flag. The compiler would skip optimization for such
// components, but they should still render correctly at runtime.
//
// The pattern: hooks are always called in the same order (no runtime violation)
// but the conditional early return creates a code path that a static analysis
// tool might flag as potentially violating the Rules.

const RuleViolationComponent: React.FC<{
  shouldRender: boolean;
  renderCounter: RenderCounter;
}> = ({ shouldRender, renderCounter }) => {
  renderCounter.count += 1;

  const [value, setValue] = useState(0);
  const [extra, setExtra] = useState('extra');

  if (shouldRender) {
    return (
      <div data-testid="violation">
        <span>{value}</span>
        <span>{extra}</span>
        <button
          data-testid="inc"
          onClick={() => setValue((v) => v + 1)}
        >
          Inc
        </button>
      </div>
    );
  }

  return (
    <div data-testid="violation">
      <span>{value}</span>
      <button
        data-testid="inc"
        onClick={() => setValue((v) => v + 1)}
      >
        Inc
      </button>
    </div>
  );
};

// ─── UnmemoizedComponent ──────────────────────────────────────────────────────
// A component intentionally NOT wrapped in React.memo.
// Represents a component that React Compiler would NOT optimize
// (e.g., due to Rules of React violations or other heuristics).

const UnmemoizedComponentBase: React.FC<{
  title: string;
  renderCounter: RenderCounter;
}> = ({ title, renderCounter }) => {
  renderCounter.count += 1;
  return (
    <div data-testid="unmemoized">
      <span>{title}</span>
    </div>
  );
};

// Intentionally NOT wrapped in React.memo
const UnmemoizedComponent = UnmemoizedComponentBase;

// ─── Parent Component for Props Testing ───────────────────────────────────────
const SimpleParent: React.FC<{
  title: string;
  value: number;
  renderCounter: RenderCounter;
}> = ({ title, value, renderCounter }) => {
  return (
    <SimpleComponent
      title={title}
      value={value}
      renderCounter={renderCounter}
    />
  );
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('React Compiler Behavior Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('[P0] SimpleComponent memoization', () => {
    it('should render once with initial props', () => {
      const counter = createRenderCounter();
      render(
        <SimpleComponent
          title="Hello"
          value={42}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(1);
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should not re-render when re-rendered with same props (memoized)', () => {
      const counter = createRenderCounter();
      const { rerender } = render(
        <SimpleComponent
          title="Hello"
          value={42}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(1);

      rerender(
        <SimpleComponent
          title="Hello"
          value={42}
          renderCounter={counter}
        />
      );

      // React.memo should prevent re-render with identical props
      expect(counter.getCount()).toBe(1);
    });

    it('should re-render when props change', () => {
      const counter = createRenderCounter();
      const { rerender } = render(
        <SimpleComponent
          title="Hello"
          value={42}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(1);

      rerender(
        <SimpleComponent
          title="World"
          value={42}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(2);
      expect(screen.getByText('World')).toBeInTheDocument();
    });

    it('should handle multiple sequential prop changes', () => {
      const counter = createRenderCounter();
      const { rerender } = render(
        <SimpleComponent
          title="A"
          value={1}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(1);

      rerender(
        <SimpleComponent
          title="B"
          value={1}
          renderCounter={counter}
        />
      );
      expect(counter.getCount()).toBe(2);

      rerender(
        <SimpleComponent
          title="B"
          value={2}
          renderCounter={counter}
        />
      );
      expect(counter.getCount()).toBe(3);

      rerender(
        <SimpleComponent
          title="C"
          value={3}
          renderCounter={counter}
        />
      );
      expect(counter.getCount()).toBe(4);
    });

    it('should re-render when value prop changes but not title', () => {
      const counter = createRenderCounter();
      const { rerender } = render(
        <SimpleComponent
          title="Same"
          value={10}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(1);

      rerender(
        <SimpleComponent
          title="Same"
          value={20}
          renderCounter={counter}
        />
      );
      expect(counter.getCount()).toBe(2);
    });
  });

  describe('[P0] SimpleParent re-render isolation', () => {
    it('child should not re-render when parent passes same props', () => {
      const counter = createRenderCounter();
      const { rerender } = render(
        <SimpleParent
          title="Hello"
          value={42}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(1);

      rerender(
        <SimpleParent
          title="Hello"
          value={42}
          renderCounter={counter}
        />
      );

      // Child wrapped in React.memo should skip re-render
      expect(counter.getCount()).toBe(1);
    });

    it('child should re-render when parent passes changed props', () => {
      const counter = createRenderCounter();
      const { rerender } = render(
        <SimpleParent
          title="Hello"
          value={42}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(1);

      rerender(
        <SimpleParent
          title="Updated"
          value={42}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(2);
    });
  });

  describe('[P0] MemoComponent useMemo behavior', () => {
    it('should compute derived values correctly on first render', () => {
      const counter = createRenderCounter();
      render(
        <MemoComponent
          items={['banana', 'apple', 'cherry']}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(1);
      expect(screen.getByText('apple')).toBeInTheDocument();
      expect(screen.getByText('banana')).toBeInTheDocument();
      expect(screen.getByText('cherry')).toBeInTheDocument();
      // banana(6) + apple(5) + cherry(6) = 17
      expect(screen.getByTestId('total-length').textContent).toBe(
        '17'
      );
    });

    it('should not re-render when dependencies are same reference', () => {
      const counter = createRenderCounter();
      const items = ['banana', 'apple', 'cherry'];
      const { rerender } = render(
        <MemoComponent items={items} renderCounter={counter} />
      );

      expect(counter.getCount()).toBe(1);

      rerender(
        <MemoComponent items={items} renderCounter={counter} />
      );

      // React.memo + same reference = no re-render
      expect(counter.getCount()).toBe(1);
    });

    it('should re-render when dependencies change', () => {
      const counter = createRenderCounter();
      const { rerender } = render(
        <MemoComponent items={['a', 'b']} renderCounter={counter} />
      );

      expect(counter.getCount()).toBe(1);
      expect(screen.getByTestId('total-length').textContent).toBe('2');

      rerender(
        <MemoComponent
          items={['a', 'b', 'cc']}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(2);
      expect(screen.getByTestId('total-length').textContent).toBe('4');
    });

    it('should handle empty items array', () => {
      const counter = createRenderCounter();
      render(
        <MemoComponent items={[]} renderCounter={counter} />
      );

      expect(counter.getCount()).toBe(1);
      expect(screen.getByTestId('total-length').textContent).toBe('0');
    });
  });

  describe('[P0] CallbackComponent useCallback behavior', () => {
    it('should render with callback-based component', () => {
      const counter = createRenderCounter();
      const handler = vi.fn();

      render(
        <CallbackComponent
          label="Click Me"
          onAction={handler}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(1);

      fireEvent.click(screen.getByTestId('callback-btn'));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should preserve callback identity when deps are unchanged', () => {
      const counter = createRenderCounter();
      const handler = vi.fn();
      const handlerRef = { current: handler };

      const { rerender } = render(
        <CallbackComponent
          label="Click"
          onAction={handlerRef.current}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(1);

      rerender(
        <CallbackComponent
          label="Click"
          onAction={handlerRef.current}
          renderCounter={counter}
        />
      );

      // React.memo should prevent re-render with same callback reference
      expect(counter.getCount()).toBe(1);
    });

    it('should re-render when callback dependency changes', () => {
      const counter = createRenderCounter();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const { rerender } = render(
        <CallbackComponent
          label="Click"
          onAction={handler1}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(1);

      rerender(
        <CallbackComponent
          label="Click"
          onAction={handler2}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(2);
    });
  });

  describe('[P0] State update re-render behavior', () => {
    it('should re-render on useState update', async () => {
      const counter = createRenderCounter();

      const StatefulComponent: React.FC<{ rc: RenderCounter }> = ({
        rc,
      }) => {
        rc.count += 1;
        const [count, setCount] = useState(0);

        return (
          <div data-testid="stateful">
            <span data-testid="state-count">{count}</span>
            <button
              data-testid="inc-btn"
              onClick={() => setCount((c) => c + 1)}
            >
              Inc
            </button>
          </div>
        );
      };

      render(<StatefulComponent rc={counter} />);

      expect(counter.getCount()).toBe(1);
      expect(
        screen.getByTestId('state-count').textContent
      ).toBe('0');

      await act(async () => {
        fireEvent.click(screen.getByTestId('inc-btn'));
      });

      expect(counter.getCount()).toBe(2);
      expect(
        screen.getByTestId('state-count').textContent
      ).toBe('1');
    });

    it('should batch multiple state updates in React 19', async () => {
      const counter = createRenderCounter();

      render(<BatchedUpdateComponent renderCounter={counter} />);

      expect(counter.getCount()).toBe(1);
      expect(screen.getByTestId('count').textContent).toBe('0');
      expect(screen.getByTestId('flag').textContent).toBe('false');
      expect(screen.getByTestId('text').textContent).toBe('');

      await act(async () => {
        fireEvent.click(screen.getByTestId('batch-btn'));
      });

      // Multiple state updates batched into single re-render
      expect(counter.getCount()).toBe(2);
      expect(screen.getByTestId('count').textContent).toBe('1');
      expect(screen.getByTestId('flag').textContent).toBe('true');
      expect(screen.getByTestId('text').textContent).toBe('x');
    });
  });

  describe('[P0] React 19 automatic batching', () => {
    it('should batch state updates within event handlers', async () => {
      const counter = createRenderCounter();

      const BatchInHandler: React.FC<{ rc: RenderCounter }> = ({
        rc,
      }) => {
        rc.count += 1;
        const [a, setA] = useState(0);
        const [b, setB] = useState(0);

        return (
          <div data-testid="batch-handler">
            <span data-testid="a">{a}</span>
            <span data-testid="b">{b}</span>
            <button
              data-testid="multi-btn"
              onClick={() => {
                setA(1);
                setB(2);
                setA(3);
                setB(4);
              }}
            >
              Multi
            </button>
          </div>
        );
      };

      render(<BatchInHandler rc={counter} />);
      expect(counter.getCount()).toBe(1);

      await act(async () => {
        fireEvent.click(screen.getByTestId('multi-btn'));
      });

      // All updates in event handler batch into single render
      expect(counter.getCount()).toBe(2);
      expect(screen.getByTestId('a').textContent).toBe('3');
      expect(screen.getByTestId('b').textContent).toBe('4');
    });

    it('should also batch updates outside event handlers (React 19)', async () => {
      const counter = createRenderCounter();

      const AsyncBatchComponent: React.FC<{ rc: RenderCounter }> = ({
        rc,
      }) => {
        rc.count += 1;
        const [val, setVal] = useState(0);

        useEffect(() => {
          const handlePromise = async () => {
            setVal((v) => v + 1);
            setVal((v) => v + 1);
            setVal((v) => v + 1);
          };
          handlePromise();
        }, []);

        return <span data-testid="async-val">{val}</span>;
      };

      render(<AsyncBatchComponent rc={counter} />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByTestId('async-val').textContent).toBe('3');
      // React 19 batches updates outside event handlers as well
      expect(counter.getCount()).toBeLessThanOrEqual(3);
    });
  });

  describe('[P0] Unmemoized component (no React.memo)', () => {
    it('should always re-render when parent re-renders', () => {
      const counter = createRenderCounter();

      const { rerender } = render(
        <UnmemoizedComponent
          title="Test"
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(1);

      rerender(
        <UnmemoizedComponent
          title="Test"
          renderCounter={counter}
        />
      );

      // Without React.memo, re-render always occurs
      expect(counter.getCount()).toBe(2);
    });

    it('should demonstrate difference between memoized and unmemoized', () => {
      const memoCounter = createRenderCounter();
      const unmemoCounter = createRenderCounter();

      const TestHarness: React.FC = () => {
        return (
          <div>
            <SimpleComponent
              title="Memoized"
              value={1}
              renderCounter={memoCounter}
            />
            <UnmemoizedComponent
              title="Unmemoized"
              renderCounter={unmemoCounter}
            />
          </div>
        );
      };

      const { rerender } = render(<TestHarness />);

      expect(memoCounter.getCount()).toBe(1);
      expect(unmemoCounter.getCount()).toBe(1);

      rerender(<TestHarness />);

      // Memoized: same props, no re-render
      expect(memoCounter.getCount()).toBe(1);
      // Unmemoized: always re-renders
      expect(unmemoCounter.getCount()).toBe(2);
    });
  });

  describe('[P1] Rule violation handling (negative test)', () => {
    it('component with Rules-of-React-style patterns should render correctly', () => {
      const counter = createRenderCounter();

      render(
        <RuleViolationComponent
          shouldRender={true}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(1);
      expect(
        screen.getByTestId('violation')
      ).toBeInTheDocument();
      expect(screen.getByText('extra')).toBeInTheDocument();
    });

    it('should handle re-renders with Rules-violation-style patterns', async () => {
      const counter = createRenderCounter();
      const { rerender } = render(
        <RuleViolationComponent
          shouldRender={true}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(1);

      await act(async () => {
        fireEvent.click(screen.getByTestId('inc'));
      });

      // useState update triggers re-render
      expect(counter.getCount()).toBe(2);
    });

    it('should handle useState updates in alternate branch', async () => {
      const counter = createRenderCounter();

      render(
        <RuleViolationComponent
          shouldRender={false}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(1);
      expect(
        screen.queryByText('extra')
      ).not.toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByTestId('inc'));
      });

      expect(counter.getCount()).toBe(2);
    });

    it('should not break when toggling between render branches', () => {
      const counter = createRenderCounter();
      const { rerender } = render(
        <RuleViolationComponent
          shouldRender={true}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(1);
      expect(screen.getByText('extra')).toBeInTheDocument();

      rerender(
        <RuleViolationComponent
          shouldRender={false}
          renderCounter={counter}
        />
      );

      // Both branches call hooks in same order, no Rules violation
      expect(counter.getCount()).toBe(2);
      expect(
        screen.queryByText('extra')
      ).not.toBeInTheDocument();
    });
  });

  describe('[P1] Mixed memoization scenarios', () => {
    it('should handle mixed memoized and non-memoized children', () => {
      const memoCounter = createRenderCounter();
      const simpleCounter = createRenderCounter();
      const unmemoCounter = createRenderCounter();
      const stableItems = ['a', 'b'];

      const MixedParent: React.FC<{ value: number }> = ({
        value,
      }) => {
        return (
          <div>
            <MemoComponent
              items={stableItems}
              renderCounter={memoCounter}
            />
            <SimpleComponent
              title="Simple"
              value={value}
              renderCounter={simpleCounter}
            />
            <UnmemoizedComponent
              title="NoMemo"
              renderCounter={unmemoCounter}
            />
          </div>
        );
      };

      const { rerender } = render(<MixedParent value={1} />);

      expect(memoCounter.getCount()).toBe(1);
      expect(simpleCounter.getCount()).toBe(1);
      expect(unmemoCounter.getCount()).toBe(1);

      // Re-render with same props
      rerender(<MixedParent value={1} />);

      // Memoized components skip re-render (stable items ref)
      expect(memoCounter.getCount()).toBe(1);
      expect(simpleCounter.getCount()).toBe(1);
      // Unmemoized component always re-renders
      expect(unmemoCounter.getCount()).toBe(2);

      // Change value prop
      rerender(<MixedParent value={2} />);

      // MemoComponent has same items reference → no re-render
      expect(memoCounter.getCount()).toBe(1);
      // SimpleComponent has different value → re-render
      expect(simpleCounter.getCount()).toBe(2);
      // Unmemoized always re-renders
      expect(unmemoCounter.getCount()).toBe(3);
    });

    it('should handle deeply nested memoized components', () => {
      const innerCounter = createRenderCounter();
      const outerCounter = createRenderCounter();

      const InnerComponentBase: React.FC<{
        value: number;
        rc: RenderCounter;
      }> = ({ value, rc }) => {
        rc.count += 1;
        return <span data-testid="inner">{value}</span>;
      };
      const InnerComponent = React.memo(InnerComponentBase);

      const OuterComponent: React.FC<{
        value: number;
        innerRc: RenderCounter;
        outerRc: RenderCounter;
      }> = ({ value, innerRc, outerRc }) => {
        outerRc.count += 1;
        return (
          <div>
            <InnerComponent value={value} rc={innerRc} />
          </div>
        );
      };

      const { rerender } = render(
        <OuterComponent
          value={10}
          innerRc={innerCounter}
          outerRc={outerCounter}
        />
      );

      expect(outerCounter.getCount()).toBe(1);
      expect(innerCounter.getCount()).toBe(1);

      // Re-render outer with same props
      rerender(
        <OuterComponent
          value={10}
          innerRc={innerCounter}
          outerRc={outerCounter}
        />
      );

      // Inner is memoized, outer is not
      expect(outerCounter.getCount()).toBe(2);
      expect(innerCounter.getCount()).toBe(1);

      // Change value
      rerender(
        <OuterComponent
          value={20}
          innerRc={innerCounter}
          outerRc={outerCounter}
        />
      );

      expect(outerCounter.getCount()).toBe(3);
      expect(innerCounter.getCount()).toBe(2);
    });
  });

  describe('[P1] Edge cases and stability', () => {
    it('should handle undefined prop values gracefully', () => {
      const counter = createRenderCounter();

      const UndefinedComponent: React.FC<{
        title?: string;
        value?: number;
        rc: RenderCounter;
      }> = ({ title, value, rc }) => {
        rc.count += 1;
        return (
          <div data-testid="undef">
            <span>{title ?? 'default'}</span>
            <span>{value ?? 0}</span>
          </div>
        );
      };

      const MemoUndefined = React.memo(UndefinedComponent);

      const { rerender } = render(
        <MemoUndefined rc={counter} />
      );

      expect(counter.getCount()).toBe(1);
      expect(screen.getByText('default')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();

      // Re-render with same undefined props (no change)
      rerender(<MemoUndefined rc={counter} />);

      expect(counter.getCount()).toBe(1);
    });

    it('should handle stable empty array reference for useMemo', () => {
      const counter = createRenderCounter();

      const StableEmptyBase: React.FC<{ rc: RenderCounter }> = ({
        rc,
      }) => {
        rc.count += 1;
        const emptyItems = useMemo(() => [], []);

        const processed = useMemo(() => {
          return emptyItems.map((item: string) =>
            item.toUpperCase()
          );
        }, [emptyItems]);

        return (
          <div data-testid="stable-empty">
            <span data-testid="processed-count">
              {processed.length}
            </span>
          </div>
        );
      };

      const StableEmpty = React.memo(StableEmptyBase);

      const { rerender } = render(
        <StableEmpty rc={counter} />
      );

      expect(counter.getCount()).toBe(1);
      expect(
        screen.getByTestId('processed-count').textContent
      ).toBe('0');

      rerender(<StableEmpty rc={counter} />);

      // React.memo + stable empty deps = no re-render
      expect(counter.getCount()).toBe(1);
    });

    it('should handle stable object reference through useMemo', () => {
      const counter = createRenderCounter();

      const StableObjectBase: React.FC<{
        config: { theme: string; lang: string };
        rc: RenderCounter;
      }> = ({ config, rc }) => {
        rc.count += 1;

        const displayConfig = useMemo(
          () => ({
            theme: config.theme.toUpperCase(),
            lang: config.lang.toLowerCase(),
          }),
          [config.theme, config.lang]
        );

        return (
          <div data-testid="stable-obj">
            <span data-testid="theme">
              {displayConfig.theme}
            </span>
            <span data-testid="lang">
              {displayConfig.lang}
            </span>
          </div>
        );
      };

      const StableObject = React.memo(StableObjectBase);

      const config = { theme: 'dark', lang: 'EN' };
      const { rerender } = render(
        <StableObject config={config} rc={counter} />
      );

      expect(counter.getCount()).toBe(1);
      expect(
        screen.getByTestId('theme').textContent
      ).toBe('DARK');
      expect(
        screen.getByTestId('lang').textContent
      ).toBe('en');

      // Same object reference
      rerender(<StableObject config={config} rc={counter} />);

      expect(counter.getCount()).toBe(1);

      // New object reference with same values → will re-render
      // (React Compiler would normalize this, but without compiler
      //  the object reference change triggers re-render)
      rerender(
        <StableObject
          config={{ theme: 'dark', lang: 'EN' }}
          rc={counter}
        />
      );

      expect(counter.getCount()).toBe(2);
    });
  });

  describe('[P1] Compiler compilationMode: infer simulation', () => {
    it('should correctly memoize components when all props are stable', () => {
      const counter = createRenderCounter();
      const props = { title: 'Infer Mode', value: 100 };

      const { rerender } = render(
        <SimpleComponent
          title={props.title}
          value={props.value}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(1);

      rerender(
        <SimpleComponent
          title={props.title}
          value={props.value}
          renderCounter={counter}
        />
      );

      // React.memo simulates compilationMode: 'infer'
      // where stable props prevent re-renders
      expect(counter.getCount()).toBe(1);
    });

    it('should memoize components with only primitive props', () => {
      const counter = createRenderCounter();

      const PrimitiveOnlyBase: React.FC<{
        name: string;
        count: number;
        active: boolean;
        rc: RenderCounter;
      }> = ({ name, count, active, rc }) => {
        rc.count += 1;
        return (
          <div data-testid="primitive">
            <span>{name}</span>
            <span>{count}</span>
            <span>{String(active)}</span>
          </div>
        );
      };

      const PrimitiveOnly = React.memo(PrimitiveOnlyBase);

      const { rerender } = render(
        <PrimitiveOnly
          name="test"
          count={5}
          active={true}
          rc={counter}
        />
      );

      expect(counter.getCount()).toBe(1);

      rerender(
        <PrimitiveOnly
          name="test"
          count={5}
          active={true}
          rc={counter}
        />
      );

      // All primitive props → React.memo prevents re-render
      expect(counter.getCount()).toBe(1);
    });

    it('should still update correctly when props change despite memoization', () => {
      const counter = createRenderCounter();

      const { rerender } = render(
        <SimpleComponent
          title="Initial"
          value={0}
          renderCounter={counter}
        />
      );

      expect(counter.getCount()).toBe(1);

      // Change both primitive props
      rerender(
        <SimpleComponent
          title="Updated"
          value={99}
          renderCounter={counter}
        />
      );

      // React.memo detects prop changes → re-render
      expect(counter.getCount()).toBe(2);
      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.getByText('99')).toBeInTheDocument();
    });
  });
});