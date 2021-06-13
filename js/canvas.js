const RED = 0, GREEN = 1, BLUE = 2;
let range_games = document.getElementById("range_games");
let chk_shade = document.getElementById("chkShade");
let chk_pieces = document.getElementById("chkPieces");
let chk_control = document.getElementById("chkControl");
let select_scheme = document.getElementById("selectScheme");
let canvas = document.getElementById("main_canvas");
let ctx = canvas.getContext("2d");
let board_size;
let edge_col = [0,0,0];
let unfitted = true;
let svg_pawn = "c0-9.04-2.45-15.8-7.36-20.27-1.63-1.55-3.66-3.02-6.07-4.39-3.35-1.98-5.03-3.79-5.03-5.42 0-0.87 0.86-1.81 2.58-2.84 2.67-1.47 4.26-3.19 4.78-5.17 0.17-0.77 0.26-1.72 0.26-2.84 0-3.96-2.03-7.06-6.07-9.29l-2.32-1.68c-0.44-0.43-0.65-0.91-0.65-1.42 0-1.47 0.52-2.93 1.55-4.39 0.69-0.95 1.03-2.07 1.03-3.36 0-2.24-1.2-3.87-3.61-4.9-0.78-0.26-1.55-0.39-2.33-0.39-2.41 0-4.13 1.07-5.16 3.23-0.35 0.68-0.52 1.37-0.52 2.06 0 0.78 0.56 2.24 1.68 4.39 0.69 1.21 0.99 2.32 0.9 3.36 0 1.03-0.99 2.06-2.96 3.1-3.96 2.32-5.94 5.42-5.94 9.29 0 3.36 1.68 6.03 5.03 8.01 1.64 1.11 2.45 2.06 2.45 2.84 0 1.63-1.67 3.44-5.03 5.42-6.2 3.78-10.16 8.39-11.88 13.81-0.94 3.01-1.42 6.63-1.42 10.85h46.09m-50.61 5.16c-0.08-1.03-0.13-3.01-0.13-5.94 0-10.59 3.1-18.5 9.3-23.75 2.07-1.72 4.69-3.4 7.88-5.04-3.28-1.03-5.47-3.53-6.59-7.49-0.43-1.29-0.64-2.62-0.64-4 0-5.76 2.92-9.9 8.77-12.39-1.37-2.5-2.06-4.95-2.06-7.36 0-3.96 1.94-6.89 5.81-8.78 1.63-0.77 3.4-1.16 5.29-1.16 4.39 0 7.62 1.68 9.68 5.03 0.95 1.47 1.42 3.1 1.42 4.91 0 2.32-0.77 4.78-2.32 7.36 5.94 2.41 8.91 6.54 8.91 12.39 0 4.56-1.68 8.01-5.04 10.33-0.69 0.52-1.46 0.9-2.32 1.16 7.75 3.96 12.78 9 15.1 15.11 1.47 3.78 2.2 8.34 2.2 13.68 0 2.84-0.04 4.82-0.13 5.94h-55.13"
let svg_knight = "c1.21 0 1.81 0.82 1.81 2.45 0 2.16-1.07 3.23-3.23 3.23-0.86 0-1.29-0.69-1.29-2.06 0-2.41 0.91-3.62 2.71-3.62m9.3-15.75c-1.21 0-1.81-0.73-1.81-2.19 0-2.33 1.38-4.22 4.13-5.68 1.21-0.61 2.33-0.91 3.36-0.91 1.81 0 2.8 0.61 2.97 1.81 0 1.98-1.55 3.87-4.65 5.68-1.55 0.86-2.88 1.29-4 1.29m1.03-24.27c0.35 1.21 0.52 2.02 0.52 2.45 0 0.26-0.13 0.95-0.39 2.07 1.38 0 3.27-0.69 5.68-2.07-2.32-1.2-4.26-2.02-5.81-2.45m-15.36 44.41c0.52 2.07 1.89 3.57 4.13 4.52 0.86 0.34 1.68 0.52 2.45 0.52h0.26c0.17 0 1.12-0.52 2.84-1.55 0.52-0.35 0.95-0.52 1.29-0.52h0.52c0.43 0 0.64 0.26 0.64 0.78l-0.77 2.45c0 0.77 0.6 1.16 1.81 1.16 0.17 0 1.25-1.51 3.22-4.52 3.79-5.85 9.17-10.28 16.14-13.3 0.69-4.64 2.41-8.73 5.17-12.26 0.68-0.95 1.37-1.42 2.06-1.42 0.78 0 1.16 0.56 1.16 1.68 0 0.26-0.77 2.71-2.32 7.36-0.6 1.98-0.9 3.44-0.9 4.39 0 0.25 0.08 0.81 0.25 1.67 0 6.12-2.58 12.53-7.74 19.24-3.44 4.65-5.34 8.35-5.68 11.1h42.6c0.35-3.96 0.52-6.88 0.52-8.78 0-17.73-5.55-31.88-16.66-42.47-3.35-3.1-6.06-4.65-8.13-4.65h-7.75c-0.68-0.34-1.37-2.06-2.06-5.16-0.52-2.5-1.16-4.05-1.94-4.65-1.03 3.1-4.22 5.51-9.55 7.23-2.84 0.86-4.82 1.72-5.94 2.58-0.95 3.02-3.74 9.13-8.39 18.33-4.56 9.13-6.97 14.55-7.23 16.27m72.29 26.08h-54.09c0.35-5.94 2.58-11.62 6.72-17.04 3.18-4.3 5.07-6.93 5.68-7.88 1.2-1.89 1.93-4.17 2.19-6.84-5.59 2.41-9.94 5.85-13.04 10.33l-1.81 2.97c-1.29 2.06-2.1 3.23-2.45 3.48-0.52 0.43-1.07 0.65-1.68 0.65-2.67 0-4.47-0.9-5.42-2.71-0.17-0.26-0.26-0.56-0.26-0.91-0.86 0.44-1.72 0.65-2.58 0.65-4.13 0-7.4-2.58-9.81-7.75 0.69-3.78 4.3-12.52 10.84-26.2 0.69-1.29 1.21-2.33 1.55-3.1 2.58-5.77 3.88-10.11 3.88-13.04 0-0.43-0.26-2.84-0.78-7.23h1.03c4.65 0 9.08 1.46 13.3 4.39 2.32-4.05 4.26-6.07 5.81-6.07 2.75 1.46 4.65 3.53 5.68 6.2l1.42 4.26c0.86-0.17 1.59-0.26 2.2-0.26 6.88 0 13.68 4.39 20.39 13.17 7.84 10.24 11.75 24.27 11.75 42.09 0 4.04-0.17 7.66-0.52 10.84"
let svg_bishop = "c-6.02 0-10.71-0.25-14.07-0.77 0.6 1.2 0.9 2.24 0.9 3.1 0 1.29-0.25 2.36-0.77 3.22 2.49-0.77 7.14-1.16 13.94-1.16s11.45 0.39 13.94 1.16c-0.51-0.86-0.77-1.93-0.77-3.22 0-1.04 0.26-2.07 0.77-3.1-4.04 0.52-8.69 0.77-13.94 0.77m0-46.73c-1.81 0-3.05 0.82-3.74 2.45-0.17 0.43-0.26 0.86-0.26 1.29 0 1.9 0.95 3.14 2.84 3.75 0.34 0.08 0.73 0.13 1.16 0.13 1.98 0 3.27-0.91 3.87-2.71 0.09-0.35 0.13-0.74 0.13-1.17 0-1.72-0.86-2.88-2.58-3.48-0.51-0.17-0.99-0.26-1.42-0.26m0 54.87c-3.27 0-7.49 0.3-12.65 0.9-1.46 0.17-2.32 0.99-2.58 2.45 0 1.04 2.36 1.68 7.1 1.94-0.43-0.09-0.26-0.13 0.51-0.13h7.62c10.07 0 15.11-0.6 15.11-1.81 0-1.98-2.5-3.05-7.49-3.22h-3.75c-1.11 0-2.06-0.05-2.84-0.13h-1.03m-0.13-11.88c9.64 0 15.54-0.9 17.69-2.71 1.46-1.12 2.54-4.09 3.23-8.91-0.43-4.3-3.23-8.43-8.39-12.39-4.82-3.79-9.04-5.9-12.66-6.33-3.35 0.43-7.44 2.54-12.26 6.33-5.08 3.96-7.83 8.09-8.26 12.39 0.6 4.48 1.55 7.32 2.84 8.52 0.34 0.35 0.73 0.65 1.16 0.9 2.15 1.47 7.7 2.2 16.65 2.2m-2.19-6.33v-5.68h-4.39v-5.03h4.39v-5.55h4.65v5.55h4.38v5.03h-4.38v5.68h-4.65m2.06 26.34c-0.77 0-3.05 1.51-6.84 4.52-2.67 1.81-6.97 2.88-12.91 3.23-4.3 0-7.74 0.21-10.33 0.64-2.75 0.6-4.13 1.77-4.13 3.49 0.26 1.72 1.16 2.58 2.71 2.58l6.85-1.03c4.47 0 9.16-0.61 14.07-1.81 5.59-1.46 9.21-3.79 10.84-6.97 2.33 4.56 8.35 7.31 18.08 8.26 0 0 1.11 0.17 3.35 0.52h3.36l6.97 1.03c1.55 0 2.45-0.86 2.71-2.58 0-1.72-1.38-2.89-4.13-3.49l-13.81-1.03c-4.39-0.35-8.61-2.07-12.66-5.17-1.8-1.46-3.18-2.19-4.13-2.19m0.26 11.23c-3.35 3.36-8.43 5.42-15.23 6.2-2.76 0.26-7.58 0.86-14.46 1.81-1.81 0.34-2.84 1.16-3.1 2.45-1.63-0.43-4.04-3.1-7.23-8.01-0.77-1.2-1.33-2.02-1.68-2.45 2.84-5.42 6.37-8.13 10.59-8.13l7.62 0.39c3.52 0 7.66-0.82 12.39-2.46-6.11-0.77-9.17-2.62-9.17-5.55l2.59-9.81v-0.26c-5.17-5.68-7.75-11.01-7.75-16.01 0-5.68 2.8-10.84 8.39-15.49 4.91-4.13 8.52-6.32 10.84-6.58-1.89-2.33-2.84-4.74-2.84-7.23 0-3.96 1.98-6.46 5.94-7.49 0.95-0.26 1.98-0.39 3.1-0.39 4.22 0 6.97 1.59 8.26 4.78l0.65 2.71v0.39c0 2.67-0.9 5.08-2.71 7.23 2.32 0.26 5.98 2.49 10.97 6.71 5.51 4.56 8.26 9.68 8.26 15.36 0 4.82-2.58 10.16-7.74 16.01 0 1.21 0.43 2.93 1.29 5.17 0.86 2.75 1.29 4.39 1.29 4.9 0 2.93-3.06 4.78-9.17 5.55 4.65 1.64 8.78 2.46 12.4 2.46l7.61-0.39c4.22 0 7.75 2.71 10.59 8.13l-4.39 6.72c-1.46 1.89-2.97 3.14-4.52 3.74-0.34-1.72-2.84-2.8-7.48-3.23 0.6 0-0.69-0.13-3.88-0.39-10.76-1.03-17.9-3.31-21.43-6.84"
let svg_rook = "v22.85h29.44v-22.85h-29.44m-15.23 50.09l-2.45-2.45v-8.91l13.17-13.3v-25.82l-11.37-9.94v-11.75l3.75-3.61h11.62l2.19 2.19v3.36h3.75v-3.36l2.19-2.19h14.2l2.2 2.19v3.36h3.61v-3.36l2.32-2.19h11.62l3.75 3.61v11.75l-11.36 9.94v25.82l13.16 13.3v8.91l-2.45 2.45h-59.9m2.07-10.2v5.04h55.77v-5.04h-55.77m12.65-12.78l-8.52 8.26h47.51l-8.53-8.26h-30.46m10.33-47.38v3.36l-1.94 1.8h-8.39l-1.94-1.8v-3.62h-7.23l-1.68 1.81v7.23l8.78 7.1h34.6l8.78-7.1v-7.23l-1.68-1.81h-7.23v3.62l-1.94 1.8h-8.39l-1.93-1.8v-3.36h-9.81"
let svg_queen = "c1.29 0 2.84 0.05 4.65 0.13l12.78 0.78h0.13c1.55 0 2.32-0.22 2.32-0.65v-0.52c0-2.58-5.72-4.26-17.17-5.03-2.07-0.17-3.87-0.26-5.42-0.26-8.44 0-14.94 0.86-19.5 2.58-2.06 0.78-3.09 1.68-3.09 2.71v0.52c0 0.43 0.77 0.65 2.32 0.65l17.3-0.91m23.88 5.81c-6.8-0.86-13.77-1.29-20.91-1.29-7.49 0-14.46 0.43-20.92 1.29 1.04 0.86 1.55 2.54 1.55 5.04 0 1.63-0.26 2.62-0.77 2.97 5.16-0.95 11.88-1.42 20.14-1.42s14.97 0.47 20.14 1.42c-0.52-0.35-0.78-1.34-0.78-2.97 0-2.5 0.52-4.18 1.55-5.04m-20.91 11.1c-4.39 0-9.3 0.22-14.72 0.65-4.22 0.34-6.33 1.33-6.33 2.97 0 2.15 7.02 3.23 21.05 3.23s21.04-1.08 21.04-3.23c0-0.69-0.56-1.33-1.68-1.94-3.27-1.12-9.72-1.68-19.36-1.68m0-67.52c-2.15 0-3.23 1.04-3.23 3.1 0 2.24 1.08 3.36 3.23 3.36 2.06 0 3.1-1.12 3.1-3.36 0-2.06-1.04-3.1-3.1-3.1m0-3.74c3.1 0 5.25 1.42 6.45 4.26l0.65 2.58v0.39c0 0.52-0.35 1.59-1.03 3.23-1.21 3.53-1.81 6.58-1.81 9.16 0 4.22 0.94 10.46 2.84 18.72 4.65-9.81 6.97-17.21 6.97-22.2l-0.78-5.55c0-3.02 1.34-5.17 4.01-6.46 0.94-0.51 1.98-0.77 3.1-0.77 3.09 0 5.29 1.37 6.58 4.13 0.52 1.03 0.77 2.06 0.77 3.1 0 2.24-0.77 4-2.32 5.29-2.32 2.32-3.53 6.11-3.61 11.36 0 2.24 0.21 5.85 0.64 10.85 5.6-5.77 8.39-10.46 8.39-14.08l-0.64-5.03c0-2.84 1.29-4.95 3.87-6.33 1.03-0.6 2.11-0.9 3.23-0.9 2.92 0 5.12 1.33 6.58 4l0.78 2.45v0.78c0 3.53-1.98 6.2-5.94 8-0.17 3.7-1.59 10.98-4.26 21.82-0.18 0.52-0.3 0.99-0.39 1.42 0 1.21-1.38 3.27-4.13 6.2-3.7 3.7-5.55 6.58-5.55 8.65 0 0.94 1.03 3.48 3.1 7.61 0.34 0.78 0.51 1.94 0.51 3.49v0.9c-0.08 0.26-0.13 0.56-0.13 0.91v0.13l0.13 0.13c0 3.09-8.3 4.82-24.91 5.16h-3.23l-5.42-0.13h-0.13c-8.09-0.26-14.25-0.95-18.46-2.07-2.67-0.77-4.01-1.76-4.01-2.96 0.09-0.09 0.09-0.61 0-1.55-0.08-0.18-0.08-0.35 0-0.52 0-1.98 0.65-4.26 1.94-6.84 1.03-2.07 1.55-3.49 1.55-4.26 0-1.38-0.73-3.01-2.2-4.91l-6.32-7.23c-0.69-0.94-1.03-1.85-1.03-2.71-2.67-10.93-4.18-18.03-4.52-21.3-0.09-0.69-0.13-1.33-0.13-1.94-3.96-1.8-5.94-4.47-5.94-8 0-2.84 1.29-4.95 3.87-6.33 1.12-0.6 2.24-0.9 3.36-0.9 3.01 0 5.16 1.38 6.45 4.13 0.52 0.95 0.78 1.98 0.78 3.1l-0.65 5.03c0 3.79 2.76 8.48 8.27 14.08 0.43-3.79 0.64-7.41 0.64-10.85 0-4.73-0.56-7.87-1.68-9.42-0.43-0.61-1.07-1.29-1.93-2.07-1.55-1.03-2.33-2.75-2.33-5.16 0-3.02 1.42-5.21 4.26-6.59 0.95-0.43 1.98-0.64 3.1-0.64 3.01 0 5.17 1.37 6.46 4.13 0.51 0.95 0.77 1.98 0.77 3.1l-0.77 5.42v0.13c0 4.9 2.32 12.31 6.97 22.2 1.81-7.83 2.71-14.07 2.71-18.72 0-3.44-0.65-6.71-1.94-9.81-0.51-1.2-0.77-2.06-0.77-2.58 0-3.01 1.37-5.16 4.13-6.45 0.95-0.52 1.98-0.78 3.1-0.78m37.31 15.88c-1.38 0-2.37 0.69-2.97 2.07-0.09 0.34-0.13 0.68-0.13 1.03 0 1.72 0.77 2.8 2.32 3.23 0.26 0.08 0.52 0.13 0.78 0.13 2.15 0 3.22-1.12 3.22-3.36 0-2.07-1.07-3.1-3.22-3.1m-16.91-8.26c-1.47 0-2.46 0.73-2.97 2.19l-0.13 1.04c0 1.54 0.73 2.58 2.19 3.09 0.26 0.09 0.56 0.13 0.91 0.13 2.23 0 3.35-1.07 3.35-3.22 0-2.16-1.12-3.23-3.35-3.23m-41.06 0c-2.15 0-3.23 1.07-3.23 3.23 0 2.15 1.08 3.22 3.23 3.22 2.07 0 3.1-1.07 3.1-3.22 0-2.16-1.03-3.23-3.1-3.23m-16.91 8.26c-2.15 0-3.23 1.03-3.23 3.1 0 2.24 1.08 3.36 3.23 3.36 2.07 0 3.1-1.12 3.1-3.36 0-1.46-0.73-2.45-2.2-2.97-0.26-0.09-0.56-0.13-0.9-0.13m37.57 8.26c-1.21 7.58-2.76 13.04-4.65 16.4l-1.94 3.1v0.13c-0.25-0.26-1.37-1.55-3.35-3.88-2.5-2.92-5.12-8.47-7.88-16.65 0.17 1.2 0.26 2.45 0.26 3.74 0 4.05-0.73 10.29-2.19 18.72-4.65-2.75-9.17-7.14-13.56-13.17 1.46 7.41 2.58 12.27 3.36 14.59 0.51 1.72 1.16 2.71 1.93 2.97 7.06-4.04 16.4-6.07 28.02-6.07 11.7 0 21.04 2.03 28.01 6.07 1.55-0.51 3.27-6.37 5.17-17.56-4.48 6.2-8.95 10.59-13.43 13.17-1.46-7.49-2.19-13.38-2.19-17.68 0-1.12 0.08-2.72 0.25-4.78-1.72 5.16-3.7 9.77-5.94 13.81-1.2 1.81-2.53 3.53-4 5.17-0.69 0.69-1.12 1.2-1.29 1.55l-2.84-5.04c-0.08-0.34-0.21-0.69-0.39-1.03-0.68-1.9-1.8-6.41-3.35-13.56"
let svg_king = "c-17.13 0-25.823-2.88-26.081-8.65-0.431-7.92-1.765-13.9-4.003-17.94-0.946-1.64-2.28-3.62-4.002-5.94-2.926-3.88-4.561-7.15-4.905-9.82-0.086-0.68-0.13-1.42-0.13-2.19 0-5.42 2.281-9.68 6.843-12.78 1.119-0.69 2.281-1.25 3.485-1.68 4.562-1.63 9.08-1.38 13.556 0.78 1.635 0.77 3.27 1.8 4.906 3.09l0.129 0.13c0-1.8 0.086-3.74 0.258-5.81 0-0.6 0.304-1.42 0.904-2.45 1.38-2.24 3.01-4 4.91-5.29 0.34-0.17 0.68-0.39 1.03-0.65v-3.1l-5.29-3.09v-4.65h4.77l1.68-4.91h3.87l1.68 4.91h4.78v4.65l-5.29 3.09v3.1c4.47 2.84 6.75 5.68 6.84 8.52 0.17 1.72 0.26 3.62 0.26 5.68l0.12-0.13c5.43-4.56 11.11-6.02 17.05-4.39 1.55 0.43 3.01 1.08 4.39 1.94 4.82 2.93 7.27 7.27 7.35 13.04 0 3.44-1.72 7.53-5.16 12.26-2.84 3.96-4.6 6.85-5.29 8.65-1.47 3.88-2.33 8.87-2.59 14.98-0.17 5.77-8.86 8.65-26.07 8.65m0-43.51l3.74-5.94c0.6-1.29 1.08-2.49 1.42-3.61 0.17-0.6 0.26-1.85 0.26-3.74 0-5.08-1.77-7.62-5.29-7.62-3.71 0-5.56 2.54-5.56 7.62 0 1.89 0.09 3.14 0.26 3.74 0.69 2.32 2.15 5.08 4.39 8.26 0.52 0.6 0.78 1.03 0.78 1.29m34.47-0.26c0-3.87-1.29-6.84-3.88-8.9-2.15-1.81-4.69-2.71-7.61-2.71-3.7 0-7.71 1.89-12.01 5.68-5.08 4.39-7.96 10.32-8.65 17.81 0 0.6 1.59 1.29 4.78 2.07 3.7 0.69 9.98 1.03 18.85 1.03l5.81-7.75c1.8-2.75 2.71-5.16 2.71-7.23m-34.47 17.43c-2.15 0.95-8.7 1.77-19.626 2.46-1.636 0.08-2.97 0.17-4.003 0.25 0.861 3.27 1.421 6.89 1.679 10.85 5.938-1.89 13.25-2.84 21.95-2.84 8.86 0 16.18 0.95 21.94 2.84 0.26-4.3 0.82-7.92 1.68-10.85l-19.1-1.54c-1.64-0.26-3.15-0.65-4.52-1.17m-34.473-17.43c0 2.67 2.109 6.72 6.326 12.14 1.033 1.29 1.764 2.24 2.195 2.84h2.323c8.865 0 15.319-0.6 19.369-1.81 1.29-0.34 1.93-0.77 1.93-1.29-0.69-7.49-3.57-13.42-8.647-17.81-4.217-3.79-8.219-5.68-12.006-5.68-1.205 0-2.496 0.25-3.873 0.77-3.443 0.86-5.766 3.14-6.971 6.84l-0.646 3.49v0.51m34.473 39.12c8.09 0 13.68-0.51 16.78-1.55 0.77-0.26 1.16-0.56 1.16-0.9 0-2.24-5.94-3.36-17.81-3.36-4.57 0-9 0.3-13.301 0.91-3.185 0.51-4.777 1.33-4.777 2.45 0 1.29 5.078 2.11 15.238 2.45h2.71"
let svg_paths = [svg_pawn,svg_knight,svg_bishop,svg_rook,svg_queen,svg_king];
let svg_pieces = [];
let piece_imgs = [];
let domMatrix = new DOMMatrix();

for (let i=0; i<6; i++) {
  piece_imgs[i] = { black: new Image(), white: new Image() }; //onload?
  //piece_imgs[i].onload = function() {
  //  svg_pieces[i] = {
  //    path: svg_paths[i], size: piece_imgs[i].width * piece_imgs[i].height
  //  };
  //  console.log(JSON.stringify(svg_pieces[i]));
  //}
  piece_imgs[i].black.src = "img/pieces/b" + (i+1) + ".svg";
  piece_imgs[i].white.src = "img/pieces/w" + (i+1) + ".svg";
}

function resize() {
  canvas.height = window.innerHeight - 36;
  canvas.style.height = canvas.height + "px";
  canvas.width = window.innerWidth - 16;
  canvas.style.width = canvas.width + "px";
  ctx.fillStyle = 'black';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  console.log("Resizing to: " + canvas.width + "," + canvas.height);
  if (running) fitBoardsToScreen();
}

function fitBoardsToScreen() {
  num_games = range_games.valueAsNumber; //console.log("Games: " + num_games);
  let n = Math.floor(Math.sqrt(num_games));
  let board_num = 0;
  let long_length = canvas.width > canvas.height ? canvas.width : canvas.height;
  let short_length = canvas.width > canvas.height ? canvas.height : canvas.width;
  let rows = n;
  let max_cols = num_games/rows;
  board_size = Math.floor(Math.min(long_length/max_cols,short_length/rows));
  for (let row = 0; row < rows; row++) {
    let cols = Math.floor(long_length / board_size);
    let padding = long_length / cols;
    for (let i = 0; i<cols; i++) {
      if (canvas.width > canvas.height) game_list[board_num].canvas_loc = { x: padding * i , y: board_size * row };
      else game_list[board_num].canvas_loc = { y: board_size * row , x: padding * i };
      if (++board_num >= num_games) return;
    }
  }
  unfitted = false;
}

function drawBoards() {
  if (running) {
    resize();
    for (let i=0; i<num_games; i++) drawBoard(game_list[i]);
  }
}

function drawBoard(board) {
  if (unfitted) fitBoardsToScreen();
  let square_width = Math.floor(board_size / 8), square_height = Math.floor(board_size / 8);
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      board.matrix[rank][file].control = getControl(rank,file,board.matrix);
      board.matrix[rank][file].color = getColor(board.matrix[rank][file]);
    }
  }
  if (chk_shade.checked) {
    linearInterpolateBoard(board,square_width,square_height);
  }
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      let squareX = board.canvas_loc.x + (file * square_width), squareY = board.canvas_loc.y + (rank * square_height);

      if (!chk_shade.checked) {
        ctx.fillStyle = board.matrix[rank][file].color;
        ctx.fillRect(squareX, squareY, square_width, square_height);
      }

      if (chk_pieces.checked) {
        let p = board.matrix[rank][file].piece;
        if (p > 0 ) ctx.fillStyle = "cyan";
        else if (p < 0 ) ctx.fillStyle = "orange";
        else ctx.fillStyle = "green";
        //ctx.fillText(piece_chars.charAt(Math.abs(p)+6),squareX + square_width/2 ,squareY + square_height/4);
        let piece_width = square_width/2, piece_height = square_height/2;
        if (p !== 0) {
          //piece_imgs[Math.abs(p)-1].style.stroke ='yellow';
          if (p < 0) ctx.drawImage(piece_imgs[Math.abs(p)-1].black,squareX + (square_width/4),squareY + (square_height/4),piece_width,piece_height);
          else ctx.drawImage(piece_imgs[Math.abs(p)-1].white,squareX + (square_width/4),squareY + (square_height/4),piece_width,piece_height);
          //let path = new Path2D();
          //let scale =  (square_height * square_width) / svg_pieces[Math.abs(p)-1].size;
          //let path_str = "m" + ((squareX + square_width/2)/scale) + " " + ((squareY + square_height/2)/scale) + svg_pieces[Math.abs(p)-1].path;
          //path.addPath(new Path2D(path_str),domMatrix.scale(scale));
          //ctx.stroke(path);
          //ctx.closePath();
        }
      }

      if (chk_control.checked) {
        ctx.fillStyle = "yellow";
        ctx.fillText(""+ board.matrix[rank][file].control,squareX + square_width/2 ,squareY + square_height/1.5);
      }

    }
  }
  ctx.strokeStyle = "rgb(24,24,24)"; ctx.strokeRect(board.canvas_loc.x,board.canvas_loc.y,board_size,board_size);

  let move = getMoveCoords(board.last_move);
  //console.log(move);
  if (move !== null) {
    let x1 = board.canvas_loc.x + (move.from.x * square_width) + (square_width/2), y1 = board.canvas_loc.y + (move.from.y * square_height) + (square_height/2);
    let x2 = board.canvas_loc.x + (move.to.x * square_width) + (square_width/2), y2 = board.canvas_loc.y + (move.to.y * square_height) + (square_height/2);
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
    ctx.stroke(); ctx.closePath();
    ctx.beginPath();
    ctx.arc(x1,y1,8,0,Math.PI * 2,false);
    ctx.stroke();
    drawArrowhead(ctx,{x: x1, y: y1}, {x: x2, y: y2},8);
  }

}

function getAlgebraic(x,y) {
  return String.fromCharCode(('a'.charCodeAt(0) + x)) + "" + (y+1);
}

function getMoveCoords(move) {
  if (move !== "O-O" && move !== "O-O-O") {
    return {
      from: {
        x: move.charCodeAt(0) - 'a'.charCodeAt(0), y: 8 - (move.charCodeAt(1) - '0'.charCodeAt(0))
      },
      to: {
        x: move.charCodeAt(2) - 'a'.charCodeAt(0), y: 8 - (move.charCodeAt(3) - '0'.charCodeAt(0))
      }
    }
  }
  else return null;
}

function inBounds(x,y) { return (x >= 0 && y >= 0 && x < 8 && y < 8); }

function linearInterpolateBoard(board,square_width,square_height) {
  //console.log("Drawing board at: " + board.canvas_loc.x + "," + board.canvas_loc.y);
  let board_width = square_width * 8, board_height = square_height * 8;
  let padded_board_width = square_width * 10, padded_board_height = square_height * 10;
  let pixArray = [];
  for (let h=0; h < (padded_board_height); h++) {
    pixArray[h] = [];
    for (let w=0; w < (padded_board_width); w++) {
      pixArray[h][w] = [];
      for (let i = 0; i < 3; i++) pixArray[h][w][i] = 0;
    }
  }
  let w2 = Math.floor(square_width/2), h2 = Math.floor(square_height/2);
  for (let mx = -1; mx < 8; mx++)
  for (let my = -1; my < 8; my++) {
    let x = Math.floor(((mx+1) * square_width) + w2), y = Math.floor(((my+1) * square_height) + h2);
    let c1 = inBounds(my,mx) ? rgb2array(board.matrix[my][mx].color) : edge_col;
    let c2 = inBounds(my,mx+1) ? rgb2array(board.matrix[my][mx+1].color) : edge_col;
    let c3 = inBounds(my+1,mx) ? rgb2array(board.matrix[my+1][mx].color) : edge_col;
    let c4 = inBounds(my+1,mx+1) ? rgb2array(board.matrix[my+1][mx+1].color): edge_col;
    //console.log("colors: " + c1 + "," + c2 + "," + c3 + "," + c4);
    for (let i = 0; i < 3; i++) {
      for (let x1 = 0; x1 < square_width; x1++) {
        let v = x1/square_width;
        let ly = y + square_height;
        let x2 = x+x1;
        //interpolate right
        pixArray[y][x2][i] = Math.floor(lerp(v,c1[i],c2[i]));
        //console.log("x/y: " + x +"," + y + ", x1: " + x1 + ", v:" + v);
        //console.log(i + " upper pixel value: " + pixArray[y][x2][i] + ", " + c1[i] + " -> " + c2[i]);
        //interpolate right and below
        pixArray[ly][x2][i] = Math.floor(lerp(v,c3[i],c4[i]));
        //console.log(i + " lower pixel value: " + pixArray[ly][x2][i] + ", " + c3[i] + " -> " + c4[i]);
        //interpolate down
        for (let y1 = 0; y1 < square_height; y1++) {  //console.log("y:" + y + " -> " + ly);
          let y2 = y + y1;
          pixArray[y2][x2][i] = Math.floor(lerp(y1/square_height,pixArray[y][x2][i],pixArray[ly][x2][i]));
        }
      }
    }
  }
  let img_data = ctx.createImageData(board_width,board_height);
  let pixels = img_data.data;
  let px2, py2, off;
  for (let px = 0; px < board_height; px++) {
    for (let py = 0; py < board_width; py++) {
      off = (px * img_data.width + py) * 4;
      px2 = px + square_width; py2 = py + square_height;
      pixels[off] = pixArray[px2][py2][0];
      pixels[off + 1] = pixArray[px2][py2][1];
      pixels[off + 2] = pixArray[px2][py2][2];
      pixels[off + 3] = 255;
    }
  }
  ctx.putImageData(img_data,board.canvas_loc.x,board.canvas_loc.y);
}

function lerp(v, start, end) {
  return (1 - v) * start + v * end;
}

function getColor(square) { //console.log("Scheme: " + select_scheme.value);
  switch (select_scheme.value) {
    case 'COLOR_SCHEME_BLUE_RED': return getTwoColor(square,RED,GREEN,BLUE);
    case 'COLOR_SCHEME_BLUE_RED2': return getTriColor(square,RED,GREEN,BLUE);
    case 'COLOR_SCHEME_GREEN_RED': return getTwoColor(square,RED,BLUE,GREEN);
    case 'COLOR_SCHEME_GREEN_RED2': return getTriColor(square,RED,BLUE,GREEN);
    case 'COLOR_SCHEME_BLUE_GREEN': return getTwoColor(square,GREEN,RED,BLUE);
    case 'COLOR_SCHEME_BLUE_GREEN2': return getTriColor(square,GREEN,RED,BLUE);
    case 'COLOR_SCHEME_MONO': return getGrayscale(square);
  }
}

function getTwoColor(square,blackColor,voidColor,whiteColor) {
  let color_matrix = [];
  let control_grad = 256 / MAX_CONTROL;
  let c = square.control * control_grad;
  if (c < 0) {
    color_matrix[blackColor] = Math.abs(c); color_matrix[voidColor] = 0; color_matrix[whiteColor] = 0;
  }
  else {
    color_matrix[blackColor] = 0; color_matrix[voidColor] = 0; color_matrix[whiteColor] = Math.abs(c);
  }
  return rgb(color_matrix[0],color_matrix[1],color_matrix[2]);
}

function getTriColor(square,blackColor,voidColor,whiteColor) {
  let color_matrix = [];
  let control_grad = 256 / MAX_CONTROL;
  let c = square.control * control_grad;
  let piece_grad = 128/6;
  let pc = 128 + (piece_grad * square.piece);

  if (square.piece < 0) {
    color_matrix[blackColor] = Math.abs(c); color_matrix[voidColor] = pc; color_matrix[whiteColor] = 0;
  }
  else if (square.piece > 0) {
    color_matrix[blackColor] = 0; color_matrix[voidColor] = pc; color_matrix[whiteColor] = Math.abs(c);
  }
  else if (c < 0) {
    color_matrix[blackColor] = Math.abs(c); color_matrix[voidColor] = 0; color_matrix[whiteColor] = 0;
  }
  else {
    color_matrix[blackColor] = 0; color_matrix[voidColor] = 0; color_matrix[whiteColor] =  Math.abs(c);
  }
  return rgb(color_matrix[0],color_matrix[1],color_matrix[2]);
}

function getGrayscale(square) {
  let i = 128/MAX_CONTROL; let v = 128 + (square.control * i);
  return rgb(v,v,v);
}

function rgb(r, g, b){
  r = Math.floor(r);
  g = Math.floor(g);
  b = Math.floor(b);
  return ["rgb(",r,",",g,",",b,")"].join("");
}

function rgb2array(rgb) {
  return rgb.match(/\d+/g);
}

//thanks to www.jwir3.com for this snippet
function drawArrowhead(context, from, to, radius) {
  let x_center = to.x;
  let y_center = to.y;
  let angle, x, y;

  context.beginPath();

  angle = Math.atan2(to.y - from.y, to.x - from.x)
  x = radius * Math.cos(angle) + x_center;
  y = radius * Math.sin(angle) + y_center;

  context.moveTo(x, y);

  angle += (1.0/3.0) * (2 * Math.PI);
  x = radius * Math.cos(angle) + x_center;
  y = radius * Math.sin(angle) + y_center;

  context.lineTo(x, y);

  angle += (1.0/3.0) * (2 * Math.PI);
  x = radius * Math.cos(angle) + x_center;
  y = radius * Math.sin(angle) + y_center;

  context.lineTo(x, y); context.closePath(); context.fill();
}
