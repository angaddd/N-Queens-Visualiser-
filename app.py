from flask import Flask, render_template, request, jsonify
import time

app = Flask(__name__)

def is_safe(board, row, col, n):
    # Check this row on left side
    for i in range(col):
        if board[row][i] == 1:
            return False
    
    # Check upper diagonal on left side
    for i, j in zip(range(row, -1, -1), range(col, -1, -1)):
        if board[i][j] == 1:
            return False
    
    # Check lower diagonal on left side
    for i, j in zip(range(row, n, 1), range(col, -1, -1)):
        if board[i][j] == 1:
            return False
    
    return True

def solve_nq_util(board, col, n, steps):
    if col >= n:
        steps.append({
            'board': [row[:] for row in board],
            'message': f'All queens placed successfully! Solution found.',
            'is_solution': True
        })
        return True
    
    for i in range(n):
        if is_safe(board, i, col, n):
            board[i][col] = 1
            steps.append({
                'board': [row[:] for row in board],
                'message': f'Placing queen at row {i}, column {col}',
                'current_row': i,
                'current_col': col,
                'is_solution': False
            })
            
            if solve_nq_util(board, col + 1, n, steps):
                return True
            
            board[i][col] = 0
            steps.append({
                'board': [row[:] for row in board],
                'message': f'Backtracking: Removing queen from row {i}, column {col}',
                'current_row': i,
                'current_col': col,
                'is_solution': False
            })
    
    return False

def solve_n_queens(n):
    board = [[0 for _ in range(n)] for _ in range(n)]
    steps = []
    if not solve_nq_util(board, 0, n, steps):
        return None
    return steps

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/solve', methods=['POST'])
def solve():
    data = request.get_json()
    n = int(data['n'])
    steps = solve_n_queens(n)
    if steps is None:
        return jsonify({'error': f'No solution exists for {n} queens.'})
    
    return jsonify({
        'steps': steps,
        'n': n
    })

if __name__ == '__main__':
    app.run(debug=True)



    