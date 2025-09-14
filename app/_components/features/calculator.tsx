'use client'

import React, { useState } from 'react'

interface CalculatorProps {
  accessLevel: string
}

/**
 * Calculator Component
 * Simple calculator with features that vary by access level:
 * - Free: Basic arithmetic only
 * - Basic: Includes memory functions and history
 * - Premium: Advanced functions like percentage, square root, etc.
 */
export function Calculator({ accessLevel }: CalculatorProps) {
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForNewValue, setWaitingForNewValue] = useState(false)
  const [memory, setMemory] = useState(0)
  const [history, setHistory] = useState<string[]>([])

  // Feature availability based on access level
  const hasMemoryFunctions = accessLevel !== 'free'
  const hasAdvancedFunctions = accessLevel === 'premium'
  const hasHistory = accessLevel !== 'free'

  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num)
      setWaitingForNewValue(false)
    } else {
      setDisplay(display === '0' ? num : display + num)
    }
  }

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const currentValue = previousValue || 0
      const newValue = calculate(currentValue, inputValue, operation)

      setDisplay(String(newValue))
      setPreviousValue(newValue)
      
      // Add to history if available
      if (hasHistory) {
        setHistory(prev => [...prev.slice(-4), `${currentValue} ${operation} ${inputValue} = ${newValue}`])
      }
    }

    setWaitingForNewValue(true)
    setOperation(nextOperation)
  }

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue
      case '-':
        return firstValue - secondValue
      case '×':
        return firstValue * secondValue
      case '÷':
        return firstValue / secondValue
      default:
        return secondValue
    }
  }

  const performCalculation = () => {
    const inputValue = parseFloat(display)

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation)
      
      // Add to history if available
      if (hasHistory) {
        setHistory(prev => [...prev.slice(-4), `${previousValue} ${operation} ${inputValue} = ${newValue}`])
      }
      
      setDisplay(String(newValue))
      setPreviousValue(null)
      setOperation(null)
      setWaitingForNewValue(true)
    }
  }

  const clear = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setWaitingForNewValue(false)
  }

  const clearEntry = () => {
    setDisplay('0')
    setWaitingForNewValue(false)
  }

  // Memory functions (Basic and Premium only)
  const memoryRecall = () => {
    if (hasMemoryFunctions) {
      setDisplay(String(memory))
      setWaitingForNewValue(true)
    }
  }

  const memoryAdd = () => {
    if (hasMemoryFunctions) {
      setMemory(memory + parseFloat(display))
    }
  }

  const memoryClear = () => {
    if (hasMemoryFunctions) {
      setMemory(0)
    }
  }

  // Advanced functions (Premium only)
  const percentage = () => {
    if (hasAdvancedFunctions) {
      const value = parseFloat(display) / 100
      setDisplay(String(value))
      setWaitingForNewValue(true)
    }
  }

  const squareRoot = () => {
    if (hasAdvancedFunctions) {
      const value = Math.sqrt(parseFloat(display))
      setDisplay(String(value))
      setWaitingForNewValue(true)
    }
  }

  const square = () => {
    if (hasAdvancedFunctions) {
      const value = Math.pow(parseFloat(display), 2)
      setDisplay(String(value))
      setWaitingForNewValue(true)
    }
  }

  return (
    <div className="calculator">
      <div className="calculator-display">
        <div className="display-value">{display}</div>
        {memory !== 0 && hasMemoryFunctions && (
          <div className="memory-indicator">M</div>
        )}
      </div>

      <div className="calculator-buttons">
        {/* Row 1: Clear and Memory (if available) */}
        <div className="button-row">
          <button onClick={clear} className="btn btn-clear">C</button>
          <button onClick={clearEntry} className="btn btn-clear">CE</button>
          {hasMemoryFunctions ? (
            <>
              <button onClick={memoryRecall} className="btn btn-memory">MR</button>
              <button onClick={memoryClear} className="btn btn-memory">MC</button>
            </>
          ) : (
            <>
              <button disabled className="btn btn-disabled">MR</button>
              <button disabled className="btn btn-disabled">MC</button>
            </>
          )}
        </div>

        {/* Row 2: Advanced functions (Premium only) */}
        <div className="button-row">
          {hasAdvancedFunctions ? (
            <>
              <button onClick={percentage} className="btn btn-function">%</button>
              <button onClick={squareRoot} className="btn btn-function">√</button>
              <button onClick={square} className="btn btn-function">x²</button>
            </>
          ) : (
            <>
              <button disabled className="btn btn-disabled">%</button>
              <button disabled className="btn btn-disabled">√</button>
              <button disabled className="btn btn-disabled">x²</button>
            </>
          )}
          <button onClick={() => inputOperation('÷')} className="btn btn-operation">÷</button>
        </div>

        {/* Row 3: Numbers 7-9 and multiply */}
        <div className="button-row">
          <button onClick={() => inputNumber('7')} className="btn btn-number">7</button>
          <button onClick={() => inputNumber('8')} className="btn btn-number">8</button>
          <button onClick={() => inputNumber('9')} className="btn btn-number">9</button>
          <button onClick={() => inputOperation('×')} className="btn btn-operation">×</button>
        </div>

        {/* Row 4: Numbers 4-6 and subtract */}
        <div className="button-row">
          <button onClick={() => inputNumber('4')} className="btn btn-number">4</button>
          <button onClick={() => inputNumber('5')} className="btn btn-number">5</button>
          <button onClick={() => inputNumber('6')} className="btn btn-number">6</button>
          <button onClick={() => inputOperation('-')} className="btn btn-operation">-</button>
        </div>

        {/* Row 5: Numbers 1-3 and add */}
        <div className="button-row">
          <button onClick={() => inputNumber('1')} className="btn btn-number">1</button>
          <button onClick={() => inputNumber('2')} className="btn btn-number">2</button>
          <button onClick={() => inputNumber('3')} className="btn btn-number">3</button>
          <button onClick={() => inputOperation('+')} className="btn btn-operation">+</button>
        </div>

        {/* Row 6: Zero, decimal, memory add, equals */}
        <div className="button-row">
          <button onClick={() => inputNumber('0')} className="btn btn-number btn-zero">0</button>
          <button onClick={() => inputNumber('.')} className="btn btn-number">.</button>
          {hasMemoryFunctions ? (
            <button onClick={memoryAdd} className="btn btn-memory">M+</button>
          ) : (
            <button disabled className="btn btn-disabled">M+</button>
          )}
          <button onClick={performCalculation} className="btn btn-equals">=</button>
        </div>
      </div>

      {/* History section (Basic and Premium only) */}
      {hasHistory && history.length > 0 && (
        <div className="calculator-history">
          <h4>Recent Calculations</h4>
          <div className="history-list">
            {history.slice(-3).map((calculation, index) => (
              <div key={index} className="history-item">
                {calculation}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature notice */}
      <div className="calculator-features">
        <div className="feature-notice">
          {accessLevel === 'free' && (
            <p>🔒 Upgrade to <strong>Basic</strong> for memory functions and calculation history</p>
          )}
          {accessLevel === 'basic' && (
            <p>🔒 Upgrade to <strong>Premium</strong> for advanced functions (%, √, x²)</p>
          )}
          {accessLevel === 'premium' && (
            <p>✨ You have access to all calculator features!</p>
          )}
        </div>
      </div>
    </div>
  )
}
