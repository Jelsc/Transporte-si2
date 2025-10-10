import 'package:flutter/material.dart';

class NeumorphicCard extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;
  final double? width;
  final double? height;
  final Color? backgroundColor;
  final bool isPressed;

  const NeumorphicCard({
    super.key,
    required this.child,
    this.onTap,
    this.padding,
    this.width,
    this.height,
    this.backgroundColor,
    this.isPressed = false,
  });

  @override
  Widget build(BuildContext context) {
    final bgColor = backgroundColor ?? Colors.grey.shade100;
    
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: width,
        height: height,
        padding: padding ?? const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(20),
          boxShadow: isPressed
              ? [
                  // Sombra interna cuando está presionado
                  BoxShadow(
                    color: Colors.grey.shade300,
                    offset: const Offset(2, 2),
                    blurRadius: 4,
                    spreadRadius: 1,
                  ),
                  BoxShadow(
                    color: Colors.white,
                    offset: const Offset(-2, -2),
                    blurRadius: 4,
                    spreadRadius: 1,
                  ),
                ]
              : [
                  // Sombra externa cuando no está presionado
                  BoxShadow(
                    color: Colors.grey.shade300,
                    offset: const Offset(8, 8),
                    blurRadius: 16,
                    spreadRadius: 0,
                  ),
                  BoxShadow(
                    color: Colors.white,
                    offset: const Offset(-8, -8),
                    blurRadius: 16,
                    spreadRadius: 0,
                  ),
                ],
        ),
        child: child,
      ),
    );
  }
}

class NeumorphicButton extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;
  final double? width;
  final double? height;
  final Color? backgroundColor;

  const NeumorphicButton({
    super.key,
    required this.child,
    this.onTap,
    this.padding,
    this.width,
    this.height,
    this.backgroundColor,
  });

  @override
  State<NeumorphicButton> createState() => _NeumorphicButtonState();
}

class _NeumorphicButtonState extends State<NeumorphicButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      onTap: widget.onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 100),
        width: widget.width,
        height: widget.height,
        padding: widget.padding ?? const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: widget.backgroundColor ?? Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20),
          boxShadow: _isPressed
              ? [
                  // Sombra interna cuando está presionado
                  BoxShadow(
                    color: Colors.grey.shade300,
                    offset: const Offset(2, 2),
                    blurRadius: 4,
                    spreadRadius: 1,
                  ),
                  BoxShadow(
                    color: Colors.white,
                    offset: const Offset(-2, -2),
                    blurRadius: 4,
                    spreadRadius: 1,
                  ),
                ]
              : [
                  // Sombra externa cuando no está presionado
                  BoxShadow(
                    color: Colors.grey.shade300,
                    offset: const Offset(8, 8),
                    blurRadius: 16,
                    spreadRadius: 0,
                  ),
                  BoxShadow(
                    color: Colors.white,
                    offset: const Offset(-8, -8),
                    blurRadius: 16,
                    spreadRadius: 0,
                  ),
                ],
        ),
        child: Center(child: widget.child),
      ),
    );
  }
}
